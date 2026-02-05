# openapi_client.AppStoreAdminApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**app_store_admin_get_all_listings**](AppStoreAdminApi.md#app_store_admin_get_all_listings) | **POST** /app-store/admin/listings | Get All Listings (Admin)
[**app_store_admin_update_listing_status**](AppStoreAdminApi.md#app_store_admin_update_listing_status) | **POST** /app-store/admin/listing/{listingId}/status | Update Listing Status (Admin)
[**app_store_admin_update_promotion_level**](AppStoreAdminApi.md#app_store_admin_update_promotion_level) | **POST** /app-store/admin/listing/{listingId}/promotion | Update Promotion Level (Admin)
[**app_store_is_admin**](AppStoreAdminApi.md#app_store_is_admin) | **GET** /app-store/admin/check | Check Admin Status


# **app_store_admin_get_all_listings**
> AppStoreGetListingsForIntegration200Response app_store_admin_get_all_listings(app_store_admin_get_all_listings_request=app_store_admin_get_all_listings_request)

Get All Listings (Admin)

Get all App Store Listings regardless of status (admin only)

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.app_store_admin_get_all_listings_request import AppStoreAdminGetAllListingsRequest
from openapi_client.models.app_store_get_listings_for_integration200_response import AppStoreGetListingsForIntegration200Response
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to https://network.learncard.com/api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "https://network.learncard.com/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.AppStoreAdminApi(api_client)
    app_store_admin_get_all_listings_request = openapi_client.AppStoreAdminGetAllListingsRequest() # AppStoreAdminGetAllListingsRequest |  (optional)

    try:
        # Get All Listings (Admin)
        api_response = api_instance.app_store_admin_get_all_listings(app_store_admin_get_all_listings_request=app_store_admin_get_all_listings_request)
        print("The response of AppStoreAdminApi->app_store_admin_get_all_listings:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreAdminApi->app_store_admin_get_all_listings: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **app_store_admin_get_all_listings_request** | [**AppStoreAdminGetAllListingsRequest**](AppStoreAdminGetAllListingsRequest.md)|  | [optional] 

### Return type

[**AppStoreGetListingsForIntegration200Response**](AppStoreGetListingsForIntegration200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **app_store_admin_update_listing_status**
> bool app_store_admin_update_listing_status(listing_id, app_store_admin_update_listing_status_request)

Update Listing Status (Admin)

Update the status of an App Store Listing (admin only)

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.app_store_admin_update_listing_status_request import AppStoreAdminUpdateListingStatusRequest
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to https://network.learncard.com/api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "https://network.learncard.com/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.AppStoreAdminApi(api_client)
    listing_id = 'listing_id_example' # str | 
    app_store_admin_update_listing_status_request = openapi_client.AppStoreAdminUpdateListingStatusRequest() # AppStoreAdminUpdateListingStatusRequest | 

    try:
        # Update Listing Status (Admin)
        api_response = api_instance.app_store_admin_update_listing_status(listing_id, app_store_admin_update_listing_status_request)
        print("The response of AppStoreAdminApi->app_store_admin_update_listing_status:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreAdminApi->app_store_admin_update_listing_status: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **listing_id** | **str**|  | 
 **app_store_admin_update_listing_status_request** | [**AppStoreAdminUpdateListingStatusRequest**](AppStoreAdminUpdateListingStatusRequest.md)|  | 

### Return type

**bool**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **app_store_admin_update_promotion_level**
> bool app_store_admin_update_promotion_level(listing_id, app_store_admin_update_promotion_level_request)

Update Promotion Level (Admin)

Update the promotion level of an App Store Listing (admin only)

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.app_store_admin_update_promotion_level_request import AppStoreAdminUpdatePromotionLevelRequest
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to https://network.learncard.com/api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "https://network.learncard.com/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.AppStoreAdminApi(api_client)
    listing_id = 'listing_id_example' # str | 
    app_store_admin_update_promotion_level_request = openapi_client.AppStoreAdminUpdatePromotionLevelRequest() # AppStoreAdminUpdatePromotionLevelRequest | 

    try:
        # Update Promotion Level (Admin)
        api_response = api_instance.app_store_admin_update_promotion_level(listing_id, app_store_admin_update_promotion_level_request)
        print("The response of AppStoreAdminApi->app_store_admin_update_promotion_level:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreAdminApi->app_store_admin_update_promotion_level: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **listing_id** | **str**|  | 
 **app_store_admin_update_promotion_level_request** | [**AppStoreAdminUpdatePromotionLevelRequest**](AppStoreAdminUpdatePromotionLevelRequest.md)|  | 

### Return type

**bool**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **app_store_is_admin**
> bool app_store_is_admin()

Check Admin Status

Check if the current user is an App Store administrator

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to https://network.learncard.com/api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "https://network.learncard.com/api"
)

# The client must configure the authentication and authorization parameters
# in accordance with the API server security policy.
# Examples for each auth method are provided below, use the example that
# satisfies your auth use case.

# Configure Bearer authorization: Authorization
configuration = openapi_client.Configuration(
    access_token = os.environ["BEARER_TOKEN"]
)

# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.AppStoreAdminApi(api_client)

    try:
        # Check Admin Status
        api_response = api_instance.app_store_is_admin()
        print("The response of AppStoreAdminApi->app_store_is_admin:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreAdminApi->app_store_is_admin: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

**bool**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

