# openapi_client.AuthGrantsDeleteApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**auth_grants_delete_auth_grant**](AuthGrantsDeleteApi.md#auth_grants_delete_auth_grant) | **DELETE** /auth-grant/{id} | Delete AuthGrant


# **auth_grants_delete_auth_grant**
> bool auth_grants_delete_auth_grant(id)

Delete AuthGrant

Delete AuthGrant

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
    api_instance = openapi_client.AuthGrantsDeleteApi(api_client)
    id = 'id_example' # str | 

    try:
        # Delete AuthGrant
        api_response = api_instance.auth_grants_delete_auth_grant(id)
        print("The response of AuthGrantsDeleteApi->auth_grants_delete_auth_grant:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AuthGrantsDeleteApi->auth_grants_delete_auth_grant: %s\n" % e)
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

