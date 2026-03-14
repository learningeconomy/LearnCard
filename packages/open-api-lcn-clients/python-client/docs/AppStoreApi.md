# openapi_client.AppStoreApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**app_store_add_boost_to_listing**](AppStoreApi.md#app_store_add_boost_to_listing) | **POST** /app-store/listing/{listingId}/boost/add | Add Boost to Listing
[**app_store_app_event**](AppStoreApi.md#app_store_app_event) | **POST** /app-store/event | Process App Event
[**app_store_associate_listing_with_signing_authority**](AppStoreApi.md#app_store_associate_listing_with_signing_authority) | **POST** /app-store/listing/{listingId}/associate-with-signing-authority | Associate Listing with Signing Authority
[**app_store_browse_listed_apps**](AppStoreApi.md#app_store_browse_listed_apps) | **POST** /app-store/browse | Browse App Store
[**app_store_count_installed_apps**](AppStoreApi.md#app_store_count_installed_apps) | **GET** /app-store/installed/count | Count Installed Apps
[**app_store_count_listings_for_integration**](AppStoreApi.md#app_store_count_listings_for_integration) | **GET** /app-store/integration/{integrationId}/listings/count | Count Listings for Integration
[**app_store_create_listing**](AppStoreApi.md#app_store_create_listing) | **POST** /app-store/listing/create | Create App Store Listing
[**app_store_delete_listing**](AppStoreApi.md#app_store_delete_listing) | **DELETE** /app-store/listing/{listingId} | Delete App Store Listing
[**app_store_get_boosts_for_listing**](AppStoreApi.md#app_store_get_boosts_for_listing) | **GET** /app-store/listing/{listingId}/boosts | Get Boosts for Listing
[**app_store_get_installed_apps**](AppStoreApi.md#app_store_get_installed_apps) | **POST** /app-store/installed | Get Installed Apps
[**app_store_get_listing**](AppStoreApi.md#app_store_get_listing) | **GET** /app-store/listing/{listingId} | Get App Store Listing (Owner)
[**app_store_get_listing_install_count**](AppStoreApi.md#app_store_get_listing_install_count) | **GET** /app-store/listing/{listingId}/install-count | Get App Install Count
[**app_store_get_listing_signing_authority**](AppStoreApi.md#app_store_get_listing_signing_authority) | **GET** /app-store/listing/{listingId}/signing-authority | Get Listing Signing Authority
[**app_store_get_listings_for_integration**](AppStoreApi.md#app_store_get_listings_for_integration) | **POST** /app-store/integration/{integrationId}/listings | Get Listings for Integration
[**app_store_get_public_listing**](AppStoreApi.md#app_store_get_public_listing) | **GET** /app-store/public/listing/{listingId} | Get Public App Listing
[**app_store_get_public_listing_by_slug**](AppStoreApi.md#app_store_get_public_listing_by_slug) | **GET** /app-store/public/listing/slug/{slug} | Get Public App Listing by Slug
[**app_store_install_app**](AppStoreApi.md#app_store_install_app) | **POST** /app-store/listing/{listingId}/install | Install App
[**app_store_is_app_installed**](AppStoreApi.md#app_store_is_app_installed) | **GET** /app-store/listing/{listingId}/is-installed | Check if App is Installed
[**app_store_remove_boost_from_listing**](AppStoreApi.md#app_store_remove_boost_from_listing) | **POST** /app-store/listing/{listingId}/boost/remove | Remove Boost from Listing
[**app_store_submit_for_review**](AppStoreApi.md#app_store_submit_for_review) | **POST** /app-store/listing/{listingId}/submit-for-review | Submit Listing for Review
[**app_store_uninstall_app**](AppStoreApi.md#app_store_uninstall_app) | **POST** /app-store/listing/{listingId}/uninstall | Uninstall App
[**app_store_update_listing**](AppStoreApi.md#app_store_update_listing) | **POST** /app-store/listing/{listingId}/update | Update App Store Listing


# **app_store_add_boost_to_listing**
> bool app_store_add_boost_to_listing(listing_id, app_store_add_boost_to_listing_request)

Add Boost to Listing

Associate a boost with an app listing for credential issuance

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.app_store_add_boost_to_listing_request import AppStoreAddBoostToListingRequest
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
    api_instance = openapi_client.AppStoreApi(api_client)
    listing_id = 'listing_id_example' # str | 
    app_store_add_boost_to_listing_request = openapi_client.AppStoreAddBoostToListingRequest() # AppStoreAddBoostToListingRequest | 

    try:
        # Add Boost to Listing
        api_response = api_instance.app_store_add_boost_to_listing(listing_id, app_store_add_boost_to_listing_request)
        print("The response of AppStoreApi->app_store_add_boost_to_listing:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_add_boost_to_listing: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **listing_id** | **str**|  | 
 **app_store_add_boost_to_listing_request** | [**AppStoreAddBoostToListingRequest**](AppStoreAddBoostToListingRequest.md)|  | 

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

# **app_store_app_event**
> Dict[str, object] app_store_app_event(app_store_app_event_request)

Process App Event

Process a generic event from an installed app

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.app_store_app_event_request import AppStoreAppEventRequest
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
    api_instance = openapi_client.AppStoreApi(api_client)
    app_store_app_event_request = openapi_client.AppStoreAppEventRequest() # AppStoreAppEventRequest | 

    try:
        # Process App Event
        api_response = api_instance.app_store_app_event(app_store_app_event_request)
        print("The response of AppStoreApi->app_store_app_event:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_app_event: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **app_store_app_event_request** | [**AppStoreAppEventRequest**](AppStoreAppEventRequest.md)|  | 

### Return type

**Dict[str, object]**

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

# **app_store_associate_listing_with_signing_authority**
> bool app_store_associate_listing_with_signing_authority(listing_id, app_store_associate_listing_with_signing_authority_request)

Associate Listing with Signing Authority

Associate an App Store Listing with a Signing Authority

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.app_store_associate_listing_with_signing_authority_request import AppStoreAssociateListingWithSigningAuthorityRequest
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
    api_instance = openapi_client.AppStoreApi(api_client)
    listing_id = 'listing_id_example' # str | 
    app_store_associate_listing_with_signing_authority_request = openapi_client.AppStoreAssociateListingWithSigningAuthorityRequest() # AppStoreAssociateListingWithSigningAuthorityRequest | 

    try:
        # Associate Listing with Signing Authority
        api_response = api_instance.app_store_associate_listing_with_signing_authority(listing_id, app_store_associate_listing_with_signing_authority_request)
        print("The response of AppStoreApi->app_store_associate_listing_with_signing_authority:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_associate_listing_with_signing_authority: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **listing_id** | **str**|  | 
 **app_store_associate_listing_with_signing_authority_request** | [**AppStoreAssociateListingWithSigningAuthorityRequest**](AppStoreAssociateListingWithSigningAuthorityRequest.md)|  | 

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

# **app_store_browse_listed_apps**
> AppStoreGetListingsForIntegration200Response app_store_browse_listed_apps(app_store_browse_listed_apps_request=app_store_browse_listed_apps_request)

Browse App Store

Browse all publicly listed apps in the App Store

### Example


```python
import openapi_client
from openapi_client.models.app_store_browse_listed_apps_request import AppStoreBrowseListedAppsRequest
from openapi_client.models.app_store_get_listings_for_integration200_response import AppStoreGetListingsForIntegration200Response
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to https://network.learncard.com/api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "https://network.learncard.com/api"
)


# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.AppStoreApi(api_client)
    app_store_browse_listed_apps_request = openapi_client.AppStoreBrowseListedAppsRequest() # AppStoreBrowseListedAppsRequest |  (optional)

    try:
        # Browse App Store
        api_response = api_instance.app_store_browse_listed_apps(app_store_browse_listed_apps_request=app_store_browse_listed_apps_request)
        print("The response of AppStoreApi->app_store_browse_listed_apps:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_browse_listed_apps: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **app_store_browse_listed_apps_request** | [**AppStoreBrowseListedAppsRequest**](AppStoreBrowseListedAppsRequest.md)|  | [optional] 

### Return type

[**AppStoreGetListingsForIntegration200Response**](AppStoreGetListingsForIntegration200Response.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**400** | Invalid input data |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **app_store_count_installed_apps**
> float app_store_count_installed_apps()

Count Installed Apps

Count all apps you have installed

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
    api_instance = openapi_client.AppStoreApi(api_client)

    try:
        # Count Installed Apps
        api_response = api_instance.app_store_count_installed_apps()
        print("The response of AppStoreApi->app_store_count_installed_apps:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_count_installed_apps: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

**float**

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

# **app_store_count_listings_for_integration**
> float app_store_count_listings_for_integration(integration_id)

Count Listings for Integration

Count App Store Listings for your Integration

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
    api_instance = openapi_client.AppStoreApi(api_client)
    integration_id = 'integration_id_example' # str | 

    try:
        # Count Listings for Integration
        api_response = api_instance.app_store_count_listings_for_integration(integration_id)
        print("The response of AppStoreApi->app_store_count_listings_for_integration:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_count_listings_for_integration: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **integration_id** | **str**|  | 

### Return type

**float**

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**404** | Not found |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **app_store_create_listing**
> str app_store_create_listing(app_store_create_listing_request)

Create App Store Listing

Create a new App Store Listing for your Integration

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.app_store_create_listing_request import AppStoreCreateListingRequest
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
    api_instance = openapi_client.AppStoreApi(api_client)
    app_store_create_listing_request = openapi_client.AppStoreCreateListingRequest() # AppStoreCreateListingRequest | 

    try:
        # Create App Store Listing
        api_response = api_instance.app_store_create_listing(app_store_create_listing_request)
        print("The response of AppStoreApi->app_store_create_listing:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_create_listing: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **app_store_create_listing_request** | [**AppStoreCreateListingRequest**](AppStoreCreateListingRequest.md)|  | 

### Return type

**str**

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

# **app_store_delete_listing**
> bool app_store_delete_listing(listing_id)

Delete App Store Listing

Delete an App Store Listing

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
    api_instance = openapi_client.AppStoreApi(api_client)
    listing_id = 'listing_id_example' # str | 

    try:
        # Delete App Store Listing
        api_response = api_instance.app_store_delete_listing(listing_id)
        print("The response of AppStoreApi->app_store_delete_listing:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_delete_listing: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **listing_id** | **str**|  | 

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
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**404** | Not found |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **app_store_get_boosts_for_listing**
> List[AppStoreGetBoostsForListing200ResponseInner] app_store_get_boosts_for_listing(listing_id)

Get Boosts for Listing

Get all boosts associated with an app listing

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.app_store_get_boosts_for_listing200_response_inner import AppStoreGetBoostsForListing200ResponseInner
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
    api_instance = openapi_client.AppStoreApi(api_client)
    listing_id = 'listing_id_example' # str | 

    try:
        # Get Boosts for Listing
        api_response = api_instance.app_store_get_boosts_for_listing(listing_id)
        print("The response of AppStoreApi->app_store_get_boosts_for_listing:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_get_boosts_for_listing: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **listing_id** | **str**|  | 

### Return type

[**List[AppStoreGetBoostsForListing200ResponseInner]**](AppStoreGetBoostsForListing200ResponseInner.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**404** | Not found |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **app_store_get_installed_apps**
> AppStoreGetInstalledApps200Response app_store_get_installed_apps(app_store_get_listings_for_integration_request=app_store_get_listings_for_integration_request)

Get Installed Apps

Get all apps you have installed

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.app_store_get_installed_apps200_response import AppStoreGetInstalledApps200Response
from openapi_client.models.app_store_get_listings_for_integration_request import AppStoreGetListingsForIntegrationRequest
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
    api_instance = openapi_client.AppStoreApi(api_client)
    app_store_get_listings_for_integration_request = openapi_client.AppStoreGetListingsForIntegrationRequest() # AppStoreGetListingsForIntegrationRequest |  (optional)

    try:
        # Get Installed Apps
        api_response = api_instance.app_store_get_installed_apps(app_store_get_listings_for_integration_request=app_store_get_listings_for_integration_request)
        print("The response of AppStoreApi->app_store_get_installed_apps:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_get_installed_apps: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **app_store_get_listings_for_integration_request** | [**AppStoreGetListingsForIntegrationRequest**](AppStoreGetListingsForIntegrationRequest.md)|  | [optional] 

### Return type

[**AppStoreGetInstalledApps200Response**](AppStoreGetInstalledApps200Response.md)

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

# **app_store_get_listing**
> AppStoreGetListing200Response app_store_get_listing(listing_id)

Get App Store Listing (Owner)

Get an App Store Listing by id (for integration owners)

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.app_store_get_listing200_response import AppStoreGetListing200Response
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
    api_instance = openapi_client.AppStoreApi(api_client)
    listing_id = 'listing_id_example' # str | 

    try:
        # Get App Store Listing (Owner)
        api_response = api_instance.app_store_get_listing(listing_id)
        print("The response of AppStoreApi->app_store_get_listing:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_get_listing: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **listing_id** | **str**|  | 

### Return type

[**AppStoreGetListing200Response**](AppStoreGetListing200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**404** | Not found |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **app_store_get_listing_install_count**
> float app_store_get_listing_install_count(listing_id)

Get App Install Count

Get the number of users who have installed an app

### Example


```python
import openapi_client
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to https://network.learncard.com/api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "https://network.learncard.com/api"
)


# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.AppStoreApi(api_client)
    listing_id = 'listing_id_example' # str | 

    try:
        # Get App Install Count
        api_response = api_instance.app_store_get_listing_install_count(listing_id)
        print("The response of AppStoreApi->app_store_get_listing_install_count:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_get_listing_install_count: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **listing_id** | **str**|  | 

### Return type

**float**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**400** | Invalid input data |  -  |
**404** | Not found |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **app_store_get_listing_signing_authority**
> AppStoreGetListingSigningAuthority200Response app_store_get_listing_signing_authority(listing_id)

Get Listing Signing Authority

Get the primary signing authority for an App Store Listing

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.app_store_get_listing_signing_authority200_response import AppStoreGetListingSigningAuthority200Response
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
    api_instance = openapi_client.AppStoreApi(api_client)
    listing_id = 'listing_id_example' # str | 

    try:
        # Get Listing Signing Authority
        api_response = api_instance.app_store_get_listing_signing_authority(listing_id)
        print("The response of AppStoreApi->app_store_get_listing_signing_authority:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_get_listing_signing_authority: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **listing_id** | **str**|  | 

### Return type

[**AppStoreGetListingSigningAuthority200Response**](AppStoreGetListingSigningAuthority200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**404** | Not found |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **app_store_get_listings_for_integration**
> AppStoreGetListingsForIntegration200Response app_store_get_listings_for_integration(integration_id, app_store_get_listings_for_integration_request)

Get Listings for Integration

Get all App Store Listings for your Integration

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.app_store_get_listings_for_integration200_response import AppStoreGetListingsForIntegration200Response
from openapi_client.models.app_store_get_listings_for_integration_request import AppStoreGetListingsForIntegrationRequest
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
    api_instance = openapi_client.AppStoreApi(api_client)
    integration_id = 'integration_id_example' # str | 
    app_store_get_listings_for_integration_request = openapi_client.AppStoreGetListingsForIntegrationRequest() # AppStoreGetListingsForIntegrationRequest | 

    try:
        # Get Listings for Integration
        api_response = api_instance.app_store_get_listings_for_integration(integration_id, app_store_get_listings_for_integration_request)
        print("The response of AppStoreApi->app_store_get_listings_for_integration:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_get_listings_for_integration: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **integration_id** | **str**|  | 
 **app_store_get_listings_for_integration_request** | [**AppStoreGetListingsForIntegrationRequest**](AppStoreGetListingsForIntegrationRequest.md)|  | 

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

# **app_store_get_public_listing**
> AppStoreGetListingsForIntegration200ResponseRecordsInner app_store_get_public_listing(listing_id)

Get Public App Listing

Get a publicly listed app by id

### Example


```python
import openapi_client
from openapi_client.models.app_store_get_listings_for_integration200_response_records_inner import AppStoreGetListingsForIntegration200ResponseRecordsInner
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to https://network.learncard.com/api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "https://network.learncard.com/api"
)


# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.AppStoreApi(api_client)
    listing_id = 'listing_id_example' # str | 

    try:
        # Get Public App Listing
        api_response = api_instance.app_store_get_public_listing(listing_id)
        print("The response of AppStoreApi->app_store_get_public_listing:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_get_public_listing: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **listing_id** | **str**|  | 

### Return type

[**AppStoreGetListingsForIntegration200ResponseRecordsInner**](AppStoreGetListingsForIntegration200ResponseRecordsInner.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**400** | Invalid input data |  -  |
**404** | Not found |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **app_store_get_public_listing_by_slug**
> AppStoreGetListingsForIntegration200ResponseRecordsInner app_store_get_public_listing_by_slug(slug)

Get Public App Listing by Slug

Get a publicly listed app by slug

### Example


```python
import openapi_client
from openapi_client.models.app_store_get_listings_for_integration200_response_records_inner import AppStoreGetListingsForIntegration200ResponseRecordsInner
from openapi_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to https://network.learncard.com/api
# See configuration.py for a list of all supported configuration parameters.
configuration = openapi_client.Configuration(
    host = "https://network.learncard.com/api"
)


# Enter a context with an instance of the API client
with openapi_client.ApiClient(configuration) as api_client:
    # Create an instance of the API class
    api_instance = openapi_client.AppStoreApi(api_client)
    slug = 'slug_example' # str | 

    try:
        # Get Public App Listing by Slug
        api_response = api_instance.app_store_get_public_listing_by_slug(slug)
        print("The response of AppStoreApi->app_store_get_public_listing_by_slug:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_get_public_listing_by_slug: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **slug** | **str**|  | 

### Return type

[**AppStoreGetListingsForIntegration200ResponseRecordsInner**](AppStoreGetListingsForIntegration200ResponseRecordsInner.md)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**400** | Invalid input data |  -  |
**404** | Not found |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **app_store_install_app**
> bool app_store_install_app(listing_id)

Install App

Install an app from the App Store

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
    api_instance = openapi_client.AppStoreApi(api_client)
    listing_id = 'listing_id_example' # str | 

    try:
        # Install App
        api_response = api_instance.app_store_install_app(listing_id)
        print("The response of AppStoreApi->app_store_install_app:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_install_app: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **listing_id** | **str**|  | 

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
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **app_store_is_app_installed**
> bool app_store_is_app_installed(listing_id)

Check if App is Installed

Check if you have installed a specific app

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
    api_instance = openapi_client.AppStoreApi(api_client)
    listing_id = 'listing_id_example' # str | 

    try:
        # Check if App is Installed
        api_response = api_instance.app_store_is_app_installed(listing_id)
        print("The response of AppStoreApi->app_store_is_app_installed:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_is_app_installed: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **listing_id** | **str**|  | 

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
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**404** | Not found |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **app_store_remove_boost_from_listing**
> bool app_store_remove_boost_from_listing(listing_id, app_store_remove_boost_from_listing_request)

Remove Boost from Listing

Remove a boost association from an app listing

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.app_store_remove_boost_from_listing_request import AppStoreRemoveBoostFromListingRequest
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
    api_instance = openapi_client.AppStoreApi(api_client)
    listing_id = 'listing_id_example' # str | 
    app_store_remove_boost_from_listing_request = openapi_client.AppStoreRemoveBoostFromListingRequest() # AppStoreRemoveBoostFromListingRequest | 

    try:
        # Remove Boost from Listing
        api_response = api_instance.app_store_remove_boost_from_listing(listing_id, app_store_remove_boost_from_listing_request)
        print("The response of AppStoreApi->app_store_remove_boost_from_listing:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_remove_boost_from_listing: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **listing_id** | **str**|  | 
 **app_store_remove_boost_from_listing_request** | [**AppStoreRemoveBoostFromListingRequest**](AppStoreRemoveBoostFromListingRequest.md)|  | 

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

# **app_store_submit_for_review**
> bool app_store_submit_for_review(listing_id)

Submit Listing for Review

Submit a DRAFT listing for admin review

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
    api_instance = openapi_client.AppStoreApi(api_client)
    listing_id = 'listing_id_example' # str | 

    try:
        # Submit Listing for Review
        api_response = api_instance.app_store_submit_for_review(listing_id)
        print("The response of AppStoreApi->app_store_submit_for_review:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_submit_for_review: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **listing_id** | **str**|  | 

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
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **app_store_uninstall_app**
> bool app_store_uninstall_app(listing_id)

Uninstall App

Uninstall an app from your profile

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
    api_instance = openapi_client.AppStoreApi(api_client)
    listing_id = 'listing_id_example' # str | 

    try:
        # Uninstall App
        api_response = api_instance.app_store_uninstall_app(listing_id)
        print("The response of AppStoreApi->app_store_uninstall_app:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_uninstall_app: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **listing_id** | **str**|  | 

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
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **app_store_update_listing**
> bool app_store_update_listing(listing_id, app_store_update_listing_request)

Update App Store Listing

Update an App Store Listing

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.app_store_update_listing_request import AppStoreUpdateListingRequest
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
    api_instance = openapi_client.AppStoreApi(api_client)
    listing_id = 'listing_id_example' # str | 
    app_store_update_listing_request = openapi_client.AppStoreUpdateListingRequest() # AppStoreUpdateListingRequest | 

    try:
        # Update App Store Listing
        api_response = api_instance.app_store_update_listing(listing_id, app_store_update_listing_request)
        print("The response of AppStoreApi->app_store_update_listing:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AppStoreApi->app_store_update_listing: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **listing_id** | **str**|  | 
 **app_store_update_listing_request** | [**AppStoreUpdateListingRequest**](AppStoreUpdateListingRequest.md)|  | 

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

