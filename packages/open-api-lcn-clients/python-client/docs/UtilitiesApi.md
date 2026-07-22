# openapi_client.UtilitiesApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**utilities_deep_health_check**](UtilitiesApi.md#utilities_deep_health_check) | **GET** /health-check/deep | Deep health check (exercises DIDKit end to end)
[**utilities_get_challenges**](UtilitiesApi.md#utilities_get_challenges) | **GET** /challenges | Request a list of valid challenges
[**utilities_get_did**](UtilitiesApi.md#utilities_get_did) | **GET** /did | Get LCN Did
[**utilities_health_check**](UtilitiesApi.md#utilities_health_check) | **GET** /health-check | Check health of endpoint


# **utilities_deep_health_check**
> UtilitiesDeepHealthCheck200Response utilities_deep_health_check()

Deep health check (exercises DIDKit end to end)

Issues and verifies a test credential + presentation with the service keypair, proving the full DIDKit crypto path (plugin load, signing, and the runtime delegation inside the native plugin) works. Reports which DIDKit engine loaded. Added after the 2026-07-02 incidents, where shallow health checks stayed green while DIDKit paths were broken.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.utilities_deep_health_check200_response import UtilitiesDeepHealthCheck200Response
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
    api_instance = openapi_client.UtilitiesApi(api_client)

    try:
        # Deep health check (exercises DIDKit end to end)
        api_response = api_instance.utilities_deep_health_check()
        print("The response of UtilitiesApi->utilities_deep_health_check:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UtilitiesApi->utilities_deep_health_check: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**UtilitiesDeepHealthCheck200Response**](UtilitiesDeepHealthCheck200Response.md)

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

# **utilities_get_challenges**
> List[str] utilities_get_challenges(amount=amount)

Request a list of valid challenges

Generates an arbitrary number of valid challenges for a did, then returns them

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
    api_instance = openapi_client.UtilitiesApi(api_client)
    amount = 100 # int |  (optional) (default to 100)

    try:
        # Request a list of valid challenges
        api_response = api_instance.utilities_get_challenges(amount=amount)
        print("The response of UtilitiesApi->utilities_get_challenges:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UtilitiesApi->utilities_get_challenges: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **amount** | **int**|  | [optional] [default to 100]

### Return type

**List[str]**

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

# **utilities_get_did**
> str utilities_get_did()

Get LCN Did

Gets the did:web for the LCN itself

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
    api_instance = openapi_client.UtilitiesApi(api_client)

    try:
        # Get LCN Did
        api_response = api_instance.utilities_get_did()
        print("The response of UtilitiesApi->utilities_get_did:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UtilitiesApi->utilities_get_did: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

**str**

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

# **utilities_health_check**
> str utilities_health_check()

Check health of endpoint

Check if the endpoint is healthy and well

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
    api_instance = openapi_client.UtilitiesApi(api_client)

    try:
        # Check health of endpoint
        api_response = api_instance.utilities_health_check()
        print("The response of UtilitiesApi->utilities_health_check:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UtilitiesApi->utilities_health_check: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

**str**

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

