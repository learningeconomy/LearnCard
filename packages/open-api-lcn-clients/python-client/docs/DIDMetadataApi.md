# openapi_client.DIDMetadataApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**did_metadata_add_did_metadata**](DIDMetadataApi.md#did_metadata_add_did_metadata) | **POST** /did-metadata/create | Add Metadata to your did web
[**did_metadata_delete_did_metadata**](DIDMetadataApi.md#did_metadata_delete_did_metadata) | **DELETE** /did-metadata/{id} | Delete DID Metadata
[**did_metadata_get_did_metadata**](DIDMetadataApi.md#did_metadata_get_did_metadata) | **GET** /did-metadata/{id} | Get DID Metadata
[**did_metadata_get_my_did_metadata**](DIDMetadataApi.md#did_metadata_get_my_did_metadata) | **POST** /profile/did-metadata | Get My DID Metadata
[**did_metadata_update_did_metadata**](DIDMetadataApi.md#did_metadata_update_did_metadata) | **POST** /did-metadata/update/{id} | Update DID Metadata


# **did_metadata_add_did_metadata**
> bool did_metadata_add_did_metadata(did_metadata_add_did_metadata_request)

Add Metadata to your did web

Add Metadata to your did web

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.did_metadata_add_did_metadata_request import DidMetadataAddDidMetadataRequest
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
    api_instance = openapi_client.DIDMetadataApi(api_client)
    did_metadata_add_did_metadata_request = openapi_client.DidMetadataAddDidMetadataRequest() # DidMetadataAddDidMetadataRequest | 

    try:
        # Add Metadata to your did web
        api_response = api_instance.did_metadata_add_did_metadata(did_metadata_add_did_metadata_request)
        print("The response of DIDMetadataApi->did_metadata_add_did_metadata:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DIDMetadataApi->did_metadata_add_did_metadata: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **did_metadata_add_did_metadata_request** | [**DidMetadataAddDidMetadataRequest**](DidMetadataAddDidMetadataRequest.md)|  | 

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
**0** | Error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **did_metadata_delete_did_metadata**
> bool did_metadata_delete_did_metadata(id)

Delete DID Metadata

Delete DID Metadata

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
    api_instance = openapi_client.DIDMetadataApi(api_client)
    id = 'id_example' # str | 

    try:
        # Delete DID Metadata
        api_response = api_instance.did_metadata_delete_did_metadata(id)
        print("The response of DIDMetadataApi->did_metadata_delete_did_metadata:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DIDMetadataApi->did_metadata_delete_did_metadata: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 

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
**0** | Error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **did_metadata_get_did_metadata**
> DidMetadataGetDidMetadata200Response did_metadata_get_did_metadata(id)

Get DID Metadata

Get DID Metadata

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.did_metadata_get_did_metadata200_response import DidMetadataGetDidMetadata200Response
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
    api_instance = openapi_client.DIDMetadataApi(api_client)
    id = 'id_example' # str | 

    try:
        # Get DID Metadata
        api_response = api_instance.did_metadata_get_did_metadata(id)
        print("The response of DIDMetadataApi->did_metadata_get_did_metadata:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DIDMetadataApi->did_metadata_get_did_metadata: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 

### Return type

[**DidMetadataGetDidMetadata200Response**](DidMetadataGetDidMetadata200Response.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**0** | Error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **did_metadata_get_my_did_metadata**
> List[DidMetadataGetMyDidMetadata200ResponseInner] did_metadata_get_my_did_metadata()

Get My DID Metadata

Get My DID Metadata

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.did_metadata_get_my_did_metadata200_response_inner import DidMetadataGetMyDidMetadata200ResponseInner
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
    api_instance = openapi_client.DIDMetadataApi(api_client)

    try:
        # Get My DID Metadata
        api_response = api_instance.did_metadata_get_my_did_metadata()
        print("The response of DIDMetadataApi->did_metadata_get_my_did_metadata:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DIDMetadataApi->did_metadata_get_my_did_metadata: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**List[DidMetadataGetMyDidMetadata200ResponseInner]**](DidMetadataGetMyDidMetadata200ResponseInner.md)

### Authorization

[Authorization](../README.md#Authorization)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json

### HTTP response details

| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Successful response |  -  |
**0** | Error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **did_metadata_update_did_metadata**
> bool did_metadata_update_did_metadata(id, did_metadata_update_did_metadata_request)

Update DID Metadata

Update DID Metadata

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.did_metadata_update_did_metadata_request import DidMetadataUpdateDidMetadataRequest
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
    api_instance = openapi_client.DIDMetadataApi(api_client)
    id = 'id_example' # str | 
    did_metadata_update_did_metadata_request = openapi_client.DidMetadataUpdateDidMetadataRequest() # DidMetadataUpdateDidMetadataRequest | 

    try:
        # Update DID Metadata
        api_response = api_instance.did_metadata_update_did_metadata(id, did_metadata_update_did_metadata_request)
        print("The response of DIDMetadataApi->did_metadata_update_did_metadata:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling DIDMetadataApi->did_metadata_update_did_metadata: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 
 **did_metadata_update_did_metadata_request** | [**DidMetadataUpdateDidMetadataRequest**](DidMetadataUpdateDidMetadataRequest.md)|  | 

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
**0** | Error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

