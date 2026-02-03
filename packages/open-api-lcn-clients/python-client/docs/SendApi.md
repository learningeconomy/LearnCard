# openapi_client.SendApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**boost_send**](SendApi.md#boost_send) | **POST** /send | Send data to a recipient


# **boost_send**
> BoostSend200Response boost_send(boost_send_request)

Send data to a recipient

Sends data to a recipient. For boosts: creates a boost if needed, auto-issues a credential from its template, and sends it. If a contractUri is provided and the recipient has consent with write permission for the boost category, the credential is sent through the contract; otherwise it is sent normally.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_send200_response import BoostSend200Response
from openapi_client.models.boost_send_request import BoostSendRequest
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
    api_instance = openapi_client.SendApi(api_client)
    boost_send_request = openapi_client.BoostSendRequest() # BoostSendRequest | 

    try:
        # Send data to a recipient
        api_response = api_instance.boost_send(boost_send_request)
        print("The response of SendApi->boost_send:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SendApi->boost_send: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_send_request** | [**BoostSendRequest**](BoostSendRequest.md)|  | 

### Return type

[**BoostSend200Response**](BoostSend200Response.md)

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

