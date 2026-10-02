# openapi_client.ShareLinksApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**public_share_links_acknowledge_view**](ShareLinksApi.md#public_share_links_acknowledge_view) | **POST** /public/share-links/acknowledge-view | Acknowledge a share view receipt
[**public_share_links_content**](ShareLinksApi.md#public_share_links_content) | **POST** /public/share-links/{id}/content | Fetch guarded share content
[**public_share_links_resolve**](ShareLinksApi.md#public_share_links_resolve) | **POST** /public/share-links/{id} | Resolve public share metadata
[**share_links_create**](ShareLinksApi.md#share_links_create) | **POST** /share-links/create | Create an owner share link
[**share_links_get**](ShareLinksApi.md#share_links_get) | **GET** /share-links/{id} | Get owner share-link metadata
[**share_links_get_content**](ShareLinksApi.md#share_links_get_content) | **GET** /share-links/{id}/content | Get encrypted share content (owner only)
[**share_links_get_operation_status**](ShareLinksApi.md#share_links_get_operation_status) | **GET** /share-links/operations/{operationId} | Get owner scoped operation status
[**share_links_get_recovery**](ShareLinksApi.md#share_links_get_recovery) | **GET** /share-links/{id}/recovery | Get owner-encrypted recovery (owner only)
[**share_links_list**](ShareLinksApi.md#share_links_list) | **GET** /share-links | List owner share links
[**share_links_retry**](ShareLinksApi.md#share_links_retry) | **POST** /share-links/retry | Retry an owner operation
[**share_links_revoke**](ShareLinksApi.md#share_links_revoke) | **POST** /share-links/revoke | Revoke an owner share link
[**share_links_update**](ShareLinksApi.md#share_links_update) | **POST** /share-links/update | Update an owner share link


# **public_share_links_acknowledge_view**
> PublicShareLinksAcknowledgeView200Response public_share_links_acknowledge_view(public_share_links_acknowledge_view_request)

Acknowledge a share view receipt

### Example


```python
import openapi_client
from openapi_client.models.public_share_links_acknowledge_view200_response import PublicShareLinksAcknowledgeView200Response
from openapi_client.models.public_share_links_acknowledge_view_request import PublicShareLinksAcknowledgeViewRequest
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
    api_instance = openapi_client.ShareLinksApi(api_client)
    public_share_links_acknowledge_view_request = openapi_client.PublicShareLinksAcknowledgeViewRequest() # PublicShareLinksAcknowledgeViewRequest | 

    try:
        # Acknowledge a share view receipt
        api_response = api_instance.public_share_links_acknowledge_view(public_share_links_acknowledge_view_request)
        print("The response of ShareLinksApi->public_share_links_acknowledge_view:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ShareLinksApi->public_share_links_acknowledge_view: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **public_share_links_acknowledge_view_request** | [**PublicShareLinksAcknowledgeViewRequest**](PublicShareLinksAcknowledgeViewRequest.md)|  | 

### Return type

[**PublicShareLinksAcknowledgeView200Response**](PublicShareLinksAcknowledgeView200Response.md)

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

# **public_share_links_content**
> PublicShareLinksContent200Response public_share_links_content(id, public_share_links_content_request)

Fetch guarded share content

### Example


```python
import openapi_client
from openapi_client.models.public_share_links_content200_response import PublicShareLinksContent200Response
from openapi_client.models.public_share_links_content_request import PublicShareLinksContentRequest
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
    api_instance = openapi_client.ShareLinksApi(api_client)
    id = 'id_example' # str | 
    public_share_links_content_request = openapi_client.PublicShareLinksContentRequest() # PublicShareLinksContentRequest | 

    try:
        # Fetch guarded share content
        api_response = api_instance.public_share_links_content(id, public_share_links_content_request)
        print("The response of ShareLinksApi->public_share_links_content:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ShareLinksApi->public_share_links_content: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 
 **public_share_links_content_request** | [**PublicShareLinksContentRequest**](PublicShareLinksContentRequest.md)|  | 

### Return type

[**PublicShareLinksContent200Response**](PublicShareLinksContent200Response.md)

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

# **public_share_links_resolve**
> PublicShareLinksResolve200Response public_share_links_resolve(id, public_share_links_resolve_request)

Resolve public share metadata

### Example


```python
import openapi_client
from openapi_client.models.public_share_links_resolve200_response import PublicShareLinksResolve200Response
from openapi_client.models.public_share_links_resolve_request import PublicShareLinksResolveRequest
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
    api_instance = openapi_client.ShareLinksApi(api_client)
    id = 'id_example' # str | 
    public_share_links_resolve_request = openapi_client.PublicShareLinksResolveRequest() # PublicShareLinksResolveRequest | 

    try:
        # Resolve public share metadata
        api_response = api_instance.public_share_links_resolve(id, public_share_links_resolve_request)
        print("The response of ShareLinksApi->public_share_links_resolve:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ShareLinksApi->public_share_links_resolve: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 
 **public_share_links_resolve_request** | [**PublicShareLinksResolveRequest**](PublicShareLinksResolveRequest.md)|  | 

### Return type

[**PublicShareLinksResolve200Response**](PublicShareLinksResolve200Response.md)

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

# **share_links_create**
> ShareLinksCreate200Response share_links_create(share_links_create_request)

Create an owner share link

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.share_links_create200_response import ShareLinksCreate200Response
from openapi_client.models.share_links_create_request import ShareLinksCreateRequest
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
    api_instance = openapi_client.ShareLinksApi(api_client)
    share_links_create_request = openapi_client.ShareLinksCreateRequest() # ShareLinksCreateRequest | 

    try:
        # Create an owner share link
        api_response = api_instance.share_links_create(share_links_create_request)
        print("The response of ShareLinksApi->share_links_create:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ShareLinksApi->share_links_create: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **share_links_create_request** | [**ShareLinksCreateRequest**](ShareLinksCreateRequest.md)|  | 

### Return type

[**ShareLinksCreate200Response**](ShareLinksCreate200Response.md)

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

# **share_links_get**
> ShareLinksGet200Response share_links_get(id)

Get owner share-link metadata

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.share_links_get200_response import ShareLinksGet200Response
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
    api_instance = openapi_client.ShareLinksApi(api_client)
    id = 'id_example' # str | 

    try:
        # Get owner share-link metadata
        api_response = api_instance.share_links_get(id)
        print("The response of ShareLinksApi->share_links_get:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ShareLinksApi->share_links_get: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 

### Return type

[**ShareLinksGet200Response**](ShareLinksGet200Response.md)

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

# **share_links_get_content**
> ShareLinksGetContent200Response share_links_get_content(id)

Get encrypted share content (owner only)

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.share_links_get_content200_response import ShareLinksGetContent200Response
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
    api_instance = openapi_client.ShareLinksApi(api_client)
    id = 'id_example' # str | 

    try:
        # Get encrypted share content (owner only)
        api_response = api_instance.share_links_get_content(id)
        print("The response of ShareLinksApi->share_links_get_content:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ShareLinksApi->share_links_get_content: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 

### Return type

[**ShareLinksGetContent200Response**](ShareLinksGetContent200Response.md)

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

# **share_links_get_operation_status**
> ShareLinksGetOperationStatus200Response share_links_get_operation_status(operation_id, id)

Get owner scoped operation status

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.share_links_get_operation_status200_response import ShareLinksGetOperationStatus200Response
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
    api_instance = openapi_client.ShareLinksApi(api_client)
    operation_id = UUID('38400000-8cf0-11bd-b23e-10b96e4ef00d') # UUID | 
    id = 'id_example' # str | 

    try:
        # Get owner scoped operation status
        api_response = api_instance.share_links_get_operation_status(operation_id, id)
        print("The response of ShareLinksApi->share_links_get_operation_status:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ShareLinksApi->share_links_get_operation_status: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **operation_id** | **UUID**|  | 
 **id** | **str**|  | 

### Return type

[**ShareLinksGetOperationStatus200Response**](ShareLinksGetOperationStatus200Response.md)

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

# **share_links_get_recovery**
> ShareLinksGetRecovery200Response share_links_get_recovery(id)

Get owner-encrypted recovery (owner only)

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.share_links_get_recovery200_response import ShareLinksGetRecovery200Response
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
    api_instance = openapi_client.ShareLinksApi(api_client)
    id = 'id_example' # str | 

    try:
        # Get owner-encrypted recovery (owner only)
        api_response = api_instance.share_links_get_recovery(id)
        print("The response of ShareLinksApi->share_links_get_recovery:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ShareLinksApi->share_links_get_recovery: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 

### Return type

[**ShareLinksGetRecovery200Response**](ShareLinksGetRecovery200Response.md)

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

# **share_links_list**
> ShareLinksList200Response share_links_list(limit=limit, cursor=cursor)

List owner share links

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.share_links_list200_response import ShareLinksList200Response
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
    api_instance = openapi_client.ShareLinksApi(api_client)
    limit = 25 # int |  (optional) (default to 25)
    cursor = 'cursor_example' # str |  (optional)

    try:
        # List owner share links
        api_response = api_instance.share_links_list(limit=limit, cursor=cursor)
        print("The response of ShareLinksApi->share_links_list:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ShareLinksApi->share_links_list: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**|  | [optional] [default to 25]
 **cursor** | **str**|  | [optional] 

### Return type

[**ShareLinksList200Response**](ShareLinksList200Response.md)

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

# **share_links_retry**
> ShareLinksGetOperationStatus200Response share_links_retry(share_links_retry_request)

Retry an owner operation

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.share_links_get_operation_status200_response import ShareLinksGetOperationStatus200Response
from openapi_client.models.share_links_retry_request import ShareLinksRetryRequest
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
    api_instance = openapi_client.ShareLinksApi(api_client)
    share_links_retry_request = openapi_client.ShareLinksRetryRequest() # ShareLinksRetryRequest | 

    try:
        # Retry an owner operation
        api_response = api_instance.share_links_retry(share_links_retry_request)
        print("The response of ShareLinksApi->share_links_retry:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ShareLinksApi->share_links_retry: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **share_links_retry_request** | [**ShareLinksRetryRequest**](ShareLinksRetryRequest.md)|  | 

### Return type

[**ShareLinksGetOperationStatus200Response**](ShareLinksGetOperationStatus200Response.md)

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

# **share_links_revoke**
> ShareLinksCreate200Response share_links_revoke(share_links_revoke_request)

Revoke an owner share link

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.share_links_create200_response import ShareLinksCreate200Response
from openapi_client.models.share_links_revoke_request import ShareLinksRevokeRequest
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
    api_instance = openapi_client.ShareLinksApi(api_client)
    share_links_revoke_request = openapi_client.ShareLinksRevokeRequest() # ShareLinksRevokeRequest | 

    try:
        # Revoke an owner share link
        api_response = api_instance.share_links_revoke(share_links_revoke_request)
        print("The response of ShareLinksApi->share_links_revoke:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ShareLinksApi->share_links_revoke: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **share_links_revoke_request** | [**ShareLinksRevokeRequest**](ShareLinksRevokeRequest.md)|  | 

### Return type

[**ShareLinksCreate200Response**](ShareLinksCreate200Response.md)

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

# **share_links_update**
> ShareLinksCreate200Response share_links_update(share_links_update_request)

Update an owner share link

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.share_links_create200_response import ShareLinksCreate200Response
from openapi_client.models.share_links_update_request import ShareLinksUpdateRequest
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
    api_instance = openapi_client.ShareLinksApi(api_client)
    share_links_update_request = openapi_client.ShareLinksUpdateRequest() # ShareLinksUpdateRequest | 

    try:
        # Update an owner share link
        api_response = api_instance.share_links_update(share_links_update_request)
        print("The response of ShareLinksApi->share_links_update:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ShareLinksApi->share_links_update: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **share_links_update_request** | [**ShareLinksUpdateRequest**](ShareLinksUpdateRequest.md)|  | 

### Return type

[**ShareLinksCreate200Response**](ShareLinksCreate200Response.md)

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

