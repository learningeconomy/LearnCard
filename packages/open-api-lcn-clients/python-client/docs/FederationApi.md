# openapi_client.FederationApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**federation_get_trusted_services**](FederationApi.md#federation_get_trusted_services) | **GET** /federation/trusted-services | Get list of trusted brain-services
[**federation_receive**](FederationApi.md#federation_receive) | **POST** /inbox/receive | Receive Federated Inbox Credential


# **federation_get_trusted_services**
> List[FederationGetTrustedServices200ResponseInner] federation_get_trusted_services()

Get list of trusted brain-services

Returns the list of brain-services trusted by this instance

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.federation_get_trusted_services200_response_inner import FederationGetTrustedServices200ResponseInner
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
    api_instance = openapi_client.FederationApi(api_client)

    try:
        # Get list of trusted brain-services
        api_response = api_instance.federation_get_trusted_services()
        print("The response of FederationApi->federation_get_trusted_services:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FederationApi->federation_get_trusted_services: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**List[FederationGetTrustedServices200ResponseInner]**](FederationGetTrustedServices200ResponseInner.md)

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

# **federation_receive**
> FederationReceive200Response federation_receive(federation_receive_request)

Receive Federated Inbox Credential

Receives a credential from a federated LearnCard Network instance for delivery to a local user

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.federation_receive200_response import FederationReceive200Response
from openapi_client.models.federation_receive_request import FederationReceiveRequest
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
    api_instance = openapi_client.FederationApi(api_client)
    federation_receive_request = openapi_client.FederationReceiveRequest() # FederationReceiveRequest | 

    try:
        # Receive Federated Inbox Credential
        api_response = api_instance.federation_receive(federation_receive_request)
        print("The response of FederationApi->federation_receive:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling FederationApi->federation_receive: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **federation_receive_request** | [**FederationReceiveRequest**](FederationReceiveRequest.md)|  | 

### Return type

[**FederationReceive200Response**](FederationReceive200Response.md)

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

