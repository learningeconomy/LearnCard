# openapi_client.CredentialRefreshApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**credential_refresh_allocate_credential_refresh**](CredentialRefreshApi.md#credential_refresh_allocate_credential_refresh) | **POST** /credential-refresh/allocate | Allocate a managed credential refresh service
[**credential_refresh_get_credential_refresh_history**](CredentialRefreshApi.md#credential_refresh_get_credential_refresh_history) | **GET** /credential-refresh/history | Get managed credential refresh history
[**credential_refresh_publish_credential_refresh**](CredentialRefreshApi.md#credential_refresh_publish_credential_refresh) | **POST** /credential-refresh/publish | Publish a managed credential refresh version
[**credential_refresh_send_refreshable_credential**](CredentialRefreshApi.md#credential_refresh_send_refreshable_credential) | **POST** /credential-refresh/send | Send a refreshable credential


# **credential_refresh_allocate_credential_refresh**
> CredentialRefreshAllocateCredentialRefresh200Response credential_refresh_allocate_credential_refresh(credential_refresh_allocate_credential_refresh_request)

Allocate a managed credential refresh service

Allocates an unguessable managed refresh service for a credential before it is signed.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.credential_refresh_allocate_credential_refresh200_response import CredentialRefreshAllocateCredentialRefresh200Response
from openapi_client.models.credential_refresh_allocate_credential_refresh_request import CredentialRefreshAllocateCredentialRefreshRequest
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
    api_instance = openapi_client.CredentialRefreshApi(api_client)
    credential_refresh_allocate_credential_refresh_request = openapi_client.CredentialRefreshAllocateCredentialRefreshRequest() # CredentialRefreshAllocateCredentialRefreshRequest | 

    try:
        # Allocate a managed credential refresh service
        api_response = api_instance.credential_refresh_allocate_credential_refresh(credential_refresh_allocate_credential_refresh_request)
        print("The response of CredentialRefreshApi->credential_refresh_allocate_credential_refresh:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling CredentialRefreshApi->credential_refresh_allocate_credential_refresh: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **credential_refresh_allocate_credential_refresh_request** | [**CredentialRefreshAllocateCredentialRefreshRequest**](CredentialRefreshAllocateCredentialRefreshRequest.md)|  | 

### Return type

[**CredentialRefreshAllocateCredentialRefresh200Response**](CredentialRefreshAllocateCredentialRefresh200Response.md)

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

# **credential_refresh_get_credential_refresh_history**
> CredentialRefreshGetCredentialRefreshHistory200Response credential_refresh_get_credential_refresh_history(refresh_id, cursor=cursor, limit=limit)

Get managed credential refresh history

Returns cursor-paginated, metadata-only issuer audit history for a managed credential refresh. Never includes credential bodies or encrypted payloads.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.credential_refresh_get_credential_refresh_history200_response import CredentialRefreshGetCredentialRefreshHistory200Response
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
    api_instance = openapi_client.CredentialRefreshApi(api_client)
    refresh_id = 'refresh_id_example' # str | 
    cursor = 'cursor_example' # str |  (optional)
    limit = 56 # int |  (optional)

    try:
        # Get managed credential refresh history
        api_response = api_instance.credential_refresh_get_credential_refresh_history(refresh_id, cursor=cursor, limit=limit)
        print("The response of CredentialRefreshApi->credential_refresh_get_credential_refresh_history:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling CredentialRefreshApi->credential_refresh_get_credential_refresh_history: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **refresh_id** | **str**|  | 
 **cursor** | **str**|  | [optional] 
 **limit** | **int**|  | [optional] 

### Return type

[**CredentialRefreshGetCredentialRefreshHistory200Response**](CredentialRefreshGetCredentialRefreshHistory200Response.md)

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

# **credential_refresh_publish_credential_refresh**
> CredentialRefreshPublishCredentialRefresh200Response credential_refresh_publish_credential_refresh(credential_refresh_publish_credential_refresh_request)

Publish a managed credential refresh version

Publishes a new immutable version of a refreshable credential (issuer-signed or via a signing authority) and atomically advances the refresh head. The version is stored holder-encrypted only.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.credential_refresh_publish_credential_refresh200_response import CredentialRefreshPublishCredentialRefresh200Response
from openapi_client.models.credential_refresh_publish_credential_refresh_request import CredentialRefreshPublishCredentialRefreshRequest
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
    api_instance = openapi_client.CredentialRefreshApi(api_client)
    credential_refresh_publish_credential_refresh_request = openapi_client.CredentialRefreshPublishCredentialRefreshRequest() # CredentialRefreshPublishCredentialRefreshRequest | 

    try:
        # Publish a managed credential refresh version
        api_response = api_instance.credential_refresh_publish_credential_refresh(credential_refresh_publish_credential_refresh_request)
        print("The response of CredentialRefreshApi->credential_refresh_publish_credential_refresh:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling CredentialRefreshApi->credential_refresh_publish_credential_refresh: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **credential_refresh_publish_credential_refresh_request** | [**CredentialRefreshPublishCredentialRefreshRequest**](CredentialRefreshPublishCredentialRefreshRequest.md)|  | 

### Return type

[**CredentialRefreshPublishCredentialRefresh200Response**](CredentialRefreshPublishCredentialRefresh200Response.md)

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

# **credential_refresh_send_refreshable_credential**
> str credential_refresh_send_refreshable_credential(credential_refresh_send_refreshable_credential_request)

Send a refreshable credential

Binds a signed credential to its allocated refresh aggregate. The credential is stored holder-encrypted only.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.credential_refresh_send_refreshable_credential_request import CredentialRefreshSendRefreshableCredentialRequest
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
    api_instance = openapi_client.CredentialRefreshApi(api_client)
    credential_refresh_send_refreshable_credential_request = openapi_client.CredentialRefreshSendRefreshableCredentialRequest() # CredentialRefreshSendRefreshableCredentialRequest | 

    try:
        # Send a refreshable credential
        api_response = api_instance.credential_refresh_send_refreshable_credential(credential_refresh_send_refreshable_credential_request)
        print("The response of CredentialRefreshApi->credential_refresh_send_refreshable_credential:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling CredentialRefreshApi->credential_refresh_send_refreshable_credential: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **credential_refresh_send_refreshable_credential_request** | [**CredentialRefreshSendRefreshableCredentialRequest**](CredentialRefreshSendRefreshableCredentialRequest.md)|  | 

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

