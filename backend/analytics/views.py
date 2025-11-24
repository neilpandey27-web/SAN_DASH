from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Sum
from .models import StorageData
import pandas as pd
import logging

logger = logging.getLogger(__name__)


def is_lab_engineering(value):
    """
    Check if a value represents unallocated capacity placeholder.
    Returns True if value is:
    - None/blank
    - "Lab Engineering" (case-insensitive)
    - "buffer" (case-insensitive)
    - Empty string
    
    These are placeholders for unallocated capacity, NOT real tenants.
    """
    if not value:
        return True
    if isinstance(value, str):
        stripped = value.strip().lower()
        return stripped == 'lab engineering' or stripped == 'buffer' or stripped == ''
    return False


class CsrfExemptSessionAuthentication:
    def authenticate(self, request):
        user = getattr(request._request, 'user', None)
        if user and user.is_authenticated:
            return (user, None)
        return None

    def enforce_csrf(self, request):
        return


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        return Response({
            'message': 'Login successful',
            'username': user.username,
            'is_staff': user.is_staff
        })
    else:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({'message': 'Logout successful'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_auth(request):
    return Response({
        'authenticated': True,
        'username': request.user.username,
        'is_staff': request.user.is_staff
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_data(request):
    print("\n" + "=" * 80)
    print("UPLOAD ENDPOINT CALLED")
    print("=" * 80)

    try:
        print(f"User: {request.user.username}, Is Staff: {request.user.is_staff}")

        if not request.user.is_staff:
            print("ERROR: User is not staff - permission denied")
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        if 'file' not in request.FILES:
            print("ERROR: No file in request")
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES['file']
        print(f"File received: {file.name}, Size: {file.size} bytes")

        print("\n" + "=" * 80)
        print("STARTING DATA IMPORT DEBUG")
        print("=" * 80)

        # Read Excel file
        print("\nReading Excel file...")
        df = pd.read_excel(file)
        print(f"\n1. Raw data loaded: {len(df)} rows")
        print(f"   Columns: {list(df.columns)}")

        # Check for required columns
        required_columns = ['Volume', 'System', 'Pool', 'Volume Size (GB)', 'Written by Host (%)']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            print(f"ERROR: Missing columns: {missing_columns}")
            return Response({'error': f'Missing columns: {missing_columns}'}, status=status.HTTP_400_BAD_REQUEST)

        # Initial total before any processing
        initial_total = df['Volume Size (GB)'].sum()
        print(f"\n2. INITIAL TOTAL (before any processing): {initial_total:,.2f} GB")

        # Sample "Written by Host (%)" values to understand the format
        sample_values = df['Written by Host (%)'].head(10).tolist()
        print(f"\n3. Sample 'Written by Host (%)' values (first 10 rows):")
        for i, val in enumerate(sample_values, 1):
            print(f"   Row {i}: {val} (type: {type(val).__name__})")

        # Convert percentage column
        df['Written by Host (%)'] = pd.to_numeric(df['Written by Host (%)'], errors='coerce').fillna(0)

        print(f"\n4. After numeric conversion:")
        print(f"   Min value: {df['Written by Host (%)'].min()}")
        print(f"   Max value: {df['Written by Host (%)'].max()}")
        print(f"   Mean value: {df['Written by Host (%)'].mean():.4f}")
        print(f"   Sample converted values (first 5): {df['Written by Host (%)'].head().tolist()}")

        # Calculate Utilized and Left GB
        # Excel stores percentages as decimals (56.47% = 0.5647)
        df['Utilized GB'] = df['Written by Host (%)'] * df['Volume Size (GB)']
        df['Left GB'] = df['Volume Size (GB)'] - df['Utilized GB']

        print(f"\n5. After calculating Utilized/Left GB:")
        print(f"   Total Utilized GB: {df['Utilized GB'].sum():,.2f}")
        print(f"   Total Left GB: {df['Left GB'].sum():,.2f}")
        print(f"   Total Volume Size: {df['Volume Size (GB)'].sum():,.2f} GB")

        # Check for negative sizes BEFORE filtering
        negative_count = len(df[df['Volume Size (GB)'] < 0])
        if negative_count > 0:
            print(f"\n6. WARNING: Found {negative_count} rows with negative 'Volume Size (GB)'")
            print(f"   Negative rows total: {df[df['Volume Size (GB)'] < 0]['Volume Size (GB)'].sum():,.2f} GB")
        else:
            print(f"\n6. No negative 'Volume Size (GB)' values found")

        # Filter out negative sizes
        df_before_filter = df.copy()
        df = df[df['Volume Size (GB)'] >= 0]

        rows_removed = len(df_before_filter) - len(df)
        if rows_removed > 0:
            removed_total = df_before_filter[df_before_filter['Volume Size (GB)'] < 0]['Volume Size (GB)'].sum()
            print(f"\n7. FILTERING RESULTS:")
            print(f"   Rows removed: {rows_removed}")
            print(f"   Volume removed: {removed_total:,.2f} GB")
        else:
            print(f"\n7. No rows filtered (no negative values)")

        total_after_filter = df['Volume Size (GB)'].sum()
        print(f"\n8. TOTAL AFTER FILTERING: {total_after_filter:,.2f} GB")
        print(f"   Difference from initial: {initial_total - total_after_filter:,.2f} GB")

        # Delete existing data
        deleted_count = StorageData.objects.all().count()
        StorageData.objects.all().delete()
        print(f"\n9. Cleared {deleted_count} existing database records")

        # Prepare data for bulk insert
        print("\n10. Preparing data for bulk insert...")
        storage_data = []
        for idx, row in df.iterrows():
            storage_data.append(StorageData(
                volume=row['Volume'],
                pool=row['System'],  # System → Pool
                child_pool=row['Pool'],  # Pool → Child Pool
                volume_size_gb=row['Volume Size (GB)'],
                utilized_gb=row['Utilized GB'],
                left_gb=row['Left GB']
            ))

        # Bulk insert
        print(f"   Bulk creating {len(storage_data)} records...")
        StorageData.objects.bulk_create(storage_data)
        print(f"\n11. Successfully inserted {len(storage_data)} records into database")

        # Verify database totals
        db_total = StorageData.objects.aggregate(total=Sum('volume_size_gb'))['total']
        print(f"\n12. DATABASE VERIFICATION:")
        print(f"    Total in database: {db_total:,.2f} GB")
        print(f"    Expected (after filter): {total_after_filter:,.2f} GB")
        print(f"    Match: {'YES ✓' if abs(db_total - total_after_filter) < 0.01 else 'NO ✗'}")

        print("\n" + "=" * 80)
        print("DATA IMPORT DEBUG COMPLETE - SUCCESS")
        print("=" * 80 + "\n")

        return Response({
            'message': 'Data uploaded successfully',
            'rows': len(storage_data),
            'initial_total_gb': float(initial_total),
            'filtered_total_gb': float(total_after_filter),
            'database_total_gb': float(db_total),
            'rows_removed': rows_removed
        })

    except Exception as e:
        print(f"\n!!! EXCEPTION OCCURRED !!!")
        print(f"Exception type: {type(e).__name__}")
        print(f"Exception message: {str(e)}")
        import traceback
        print(f"Traceback:\n{traceback.format_exc()}")
        print("=" * 80 + "\n")
        logger.error(f"Error uploading data: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_data(request):
    """
    Unified dashboard endpoint that handles all drill-down levels via query parameters.
    
    v5.6 FIX: Backend now calculates and returns both:
    - total_capacity_tb: Includes ALL pools (including Lab Engineering/blank)
    - pools data: Excludes Lab Engineering for display
    """
    try:
        pool_name = request.GET.get('pool')
        child_pool_name = request.GET.get('child_pool')
        tenant_name = request.GET.get('tenant')

        # Level 1: Pools (no parameters)
        if not pool_name:
            # Calculate TOTAL CAPACITY (includes ALL child pools including Lab Engineering)
            # Sum ALL volumes regardless of child_pool
            all_volumes = StorageData.objects.all()
            total_capacity_tb = sum(v.volume_size_gb for v in all_volumes) / 1000
            
            # Calculate pool data by summing child pools for each parent pool
            # EXCLUDES Lab Engineering child pools
            pools = StorageData.objects.values('pool').distinct()
            pool_data = []
            for pool in pools:
                pname = pool['pool']
                    
                # Get all volumes in this parent pool, excluding Lab Engineering child pools
                volumes = StorageData.objects.filter(pool=pname).exclude(
                    child_pool__iregex=r'^\s*(lab engineering|buffer)\s*$|^\s*$'
                )

                total_size_gb = sum(v.volume_size_gb for v in volumes)
                total_utilized_gb = sum(v.utilized_gb for v in volumes)
                total_left_gb = sum(v.left_gb for v in volumes)

                # Only add pool to display if it has non-Lab-Engineering capacity
                if total_size_gb > 0:
                    pool_data.append({
                        'pool': pname,
                        'allocated_tb': total_size_gb / 1000,
                        'utilized_tb': total_utilized_gb / 1000,
                        'left_tb': total_left_gb / 1000,
                        'avg_util': (total_utilized_gb / total_size_gb) if total_size_gb > 0 else 0,
                        'volume_count': volumes.count()
                    })

            # Get top tenants (exclude Lab Engineering child pools)
            all_volumes = StorageData.objects.exclude(
                child_pool__iregex=r'^\s*(lab engineering|buffer)\s*$|^\s*$'
            )
            tenant_data = {}
            for volume in all_volumes:
                tenant = volume.volume.split('_')[0] if '_' in volume.volume else volume.volume
                # Skip if tenant name itself is Lab Engineering/Buffer
                if is_lab_engineering(tenant):
                    continue
                    
                if tenant not in tenant_data:
                    tenant_data[tenant] = {'name': tenant, 'utilized_gb': 0}
                tenant_data[tenant]['utilized_gb'] += volume.utilized_gb

            top_tenants = sorted(tenant_data.values(), key=lambda x: x['utilized_gb'], reverse=True)[:10]

            return Response({
                'level': 'pools',
                'total_capacity_tb': total_capacity_tb,  # Includes Lab Engineering child pool
                'pools': pool_data,
                'top_tenants': top_tenants
            })

        # Level 2: Child Pools (pool parameter only)
        elif pool_name and not child_pool_name:
            # Calculate TOTAL CAPACITY for this parent pool (includes ALL child pools including Lab Engineering)
            all_volumes = StorageData.objects.filter(pool=pool_name)
            total_capacity_tb = sum(v.volume_size_gb for v in all_volumes) / 1000
            
            # Calculate child pool data (EXCLUDES Lab Engineering child pools for display)
            child_pools = StorageData.objects.filter(pool=pool_name).values('child_pool').distinct()
            child_pool_data = []
            for cp in child_pools:
                cpname = cp['child_pool']
                # Skip Lab Engineering child pools
                if is_lab_engineering(cpname):
                    continue
                    
                volumes = StorageData.objects.filter(pool=pool_name, child_pool=cpname)

                total_size_gb = sum(v.volume_size_gb for v in volumes)
                total_utilized_gb = sum(v.utilized_gb for v in volumes)
                total_left_gb = sum(v.left_gb for v in volumes)

                child_pool_data.append({
                    'child_pool': cpname,
                    'allocated_tb': total_size_gb / 1000,
                    'utilized_tb': total_utilized_gb / 1000,
                    'left_tb': total_left_gb / 1000,
                    'avg_util': (total_utilized_gb / total_size_gb) if total_size_gb > 0 else 0,
                    'volume_count': volumes.count()
                })

            return Response({
                'level': 'child_pools',
                'total_capacity_tb': total_capacity_tb,  # Includes Lab Engineering child pool
                'data': child_pool_data,
                'breadcrumb': {'pool': pool_name}
            })

        # Level 3: Tenants (pool and child_pool parameters)
        elif pool_name and child_pool_name and not tenant_name:
            # Calculate TOTAL CAPACITY for this child pool (includes ALL tenants including Buffer)
            all_volumes = StorageData.objects.filter(pool=pool_name, child_pool=child_pool_name)
            total_capacity_gb = sum(v.volume_size_gb for v in all_volumes)
            
            # Calculate tenant data (EXCLUDES Buffer/Lab Engineering tenants for display)
            volumes = StorageData.objects.filter(pool=pool_name, child_pool=child_pool_name)
            tenant_data = {}
            for volume in volumes:
                tenant = volume.volume.split('_')[0] if '_' in volume.volume else volume.volume
                
                # Skip Lab Engineering/Buffer tenants
                if is_lab_engineering(tenant):
                    continue

                if tenant not in tenant_data:
                    tenant_data[tenant] = {
                        'name': tenant,
                        'allocated_gb': 0,
                        'utilized_gb': 0,
                        'left_gb': 0,
                        'volume_count': 0
                    }

                tenant_data[tenant]['allocated_gb'] += volume.volume_size_gb
                tenant_data[tenant]['utilized_gb'] += volume.utilized_gb
                tenant_data[tenant]['left_gb'] += volume.left_gb
                tenant_data[tenant]['volume_count'] += 1

            for tenant in tenant_data.values():
                if tenant['allocated_gb'] > 0:
                    tenant['avg_utilization'] = tenant['utilized_gb'] / tenant['allocated_gb']
                else:
                    tenant['avg_utilization'] = 0

            return Response({
                'level': 'tenants',
                'total_capacity_gb': total_capacity_gb,  # Includes Buffer tenant capacity
                'data': list(tenant_data.values()),
                'breadcrumb': {'pool': pool_name, 'child_pool': child_pool_name}
            })

        # Level 4: Volumes (all parameters)
        else:
            # Calculate TOTAL CAPACITY for this tenant (ALL volumes)
            all_volumes = StorageData.objects.filter(
                pool=pool_name,
                child_pool=child_pool_name,
                volume__startswith=tenant_name
            )
            total_capacity_gb = sum(v.volume_size_gb for v in all_volumes)
            
            # Get volume data
            volumes = StorageData.objects.filter(
                pool=pool_name,
                child_pool=child_pool_name,
                volume__startswith=tenant_name
            )

            volume_data = []
            for volume in volumes:
                # Calculate utilization as decimal (0.5647 = 56.47%)
                written_by_host_percent = (
                            volume.utilized_gb / volume.volume_size_gb) if volume.volume_size_gb > 0 else 0

                volume_data.append({
                    'volume': volume.volume,
                    'system': volume.pool,  # System column shows the pool name
                    'volume_size_gb': volume.volume_size_gb,
                    'utilized_gb': volume.utilized_gb,
                    'left_gb': volume.left_gb,
                    'written_by_host_percent': written_by_host_percent  # Decimal ratio
                })

            return Response({
                'level': 'volumes',
                'total_capacity_gb': total_capacity_gb,  # NEW: Total capacity
                'data': volume_data,
                'breadcrumb': {'pool': pool_name, 'child_pool': child_pool_name, 'tenant': tenant_name}
            })

    except Exception as e:
        logger.error(f"Error getting dashboard data: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
