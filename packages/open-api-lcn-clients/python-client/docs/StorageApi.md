# openapi_client.StorageApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**storage_resolve**](StorageApi.md#storage_resolve) | **GET** /storage/resolve | Resolves a URI to a Credential/Presentation
[**storage_store**](StorageApi.md#storage_store) | **POST** /storage/store | Store a Credential/Presentation


# **storage_resolve**
> StorageResolve200Response storage_resolve(uri)

Resolves a URI to a Credential/Presentation

This endpoint stores a credential/presentation, returning a uri that can be used to resolve it

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.storage_resolve200_response import StorageResolve200Response
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
    api_instance = openapi_client.StorageApi(api_client)
    uri = 'uri_example' # str | 

    try:
        # Resolves a URI to a Credential/Presentation
        api_response = api_instance.storage_resolve(uri)
        print("The response of StorageApi->storage_resolve:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling StorageApi->storage_resolve: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **uri** | **str**|  | 

### Return type

[**StorageResolve200Response**](StorageResolve200Response.md)

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

# **storage_store**
> str storage_store(storage_store_request)

Store a Credential/Presentation

This endpoint stores a credential/presentation, returning a uri that can be used to resolve it

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.storage_store_request import StorageStoreRequest
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
    api_instance = openapi_client.StorageApi(api_client)
    storage_store_request = openapi_client.StorageStoreRequest() # StorageStoreRequest | 

    try:
        # Store a Credential/Presentation
        api_response = api_instance.storage_store(storage_store_request)
        print("The response of StorageApi->storage_store:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling StorageApi->storage_store: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **storage_store_request** | [**StorageStoreRequest**](StorageStoreRequest.md)|  | 

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

