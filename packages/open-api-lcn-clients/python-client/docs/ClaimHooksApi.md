# openapi_client.ClaimHooksApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**claim_hook_create_claim_hook**](ClaimHooksApi.md#claim_hook_create_claim_hook) | **POST** /claim-hook/create | Creates a claim hook
[**claim_hook_delete_claim_hook**](ClaimHooksApi.md#claim_hook_delete_claim_hook) | **POST** /claim-hook/update | Delete a Claim Hook
[**claim_hook_get_claim_hooks_for_boost**](ClaimHooksApi.md#claim_hook_get_claim_hooks_for_boost) | **POST** /claim-hook/get | Gets Claim Hooks


# **claim_hook_create_claim_hook**
> str claim_hook_create_claim_hook(claim_hook_create_claim_hook_request)

Creates a claim hook

This route creates a claim hook. Claim hooks are an atomic action that will be performed when a boost is claimed

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.claim_hook_create_claim_hook_request import ClaimHookCreateClaimHookRequest
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
    api_instance = openapi_client.ClaimHooksApi(api_client)
    claim_hook_create_claim_hook_request = openapi_client.ClaimHookCreateClaimHookRequest() # ClaimHookCreateClaimHookRequest | 

    try:
        # Creates a claim hook
        api_response = api_instance.claim_hook_create_claim_hook(claim_hook_create_claim_hook_request)
        print("The response of ClaimHooksApi->claim_hook_create_claim_hook:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ClaimHooksApi->claim_hook_create_claim_hook: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **claim_hook_create_claim_hook_request** | [**ClaimHookCreateClaimHookRequest**](ClaimHookCreateClaimHookRequest.md)|  | 

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

# **claim_hook_delete_claim_hook**
> bool claim_hook_delete_claim_hook(claim_hook_delete_claim_hook_request)

Delete a Claim Hook

This route deletes a claim hook

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.claim_hook_delete_claim_hook_request import ClaimHookDeleteClaimHookRequest
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
    api_instance = openapi_client.ClaimHooksApi(api_client)
    claim_hook_delete_claim_hook_request = openapi_client.ClaimHookDeleteClaimHookRequest() # ClaimHookDeleteClaimHookRequest | 

    try:
        # Delete a Claim Hook
        api_response = api_instance.claim_hook_delete_claim_hook(claim_hook_delete_claim_hook_request)
        print("The response of ClaimHooksApi->claim_hook_delete_claim_hook:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ClaimHooksApi->claim_hook_delete_claim_hook: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **claim_hook_delete_claim_hook_request** | [**ClaimHookDeleteClaimHookRequest**](ClaimHookDeleteClaimHookRequest.md)|  | 

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

# **claim_hook_get_claim_hooks_for_boost**
> ClaimHookGetClaimHooksForBoost200Response claim_hook_get_claim_hooks_for_boost(claim_hook_get_claim_hooks_for_boost_request)

Gets Claim Hooks

This route gets claim hooks attached to a given boost

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.claim_hook_get_claim_hooks_for_boost200_response import ClaimHookGetClaimHooksForBoost200Response
from openapi_client.models.claim_hook_get_claim_hooks_for_boost_request import ClaimHookGetClaimHooksForBoostRequest
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
    api_instance = openapi_client.ClaimHooksApi(api_client)
    claim_hook_get_claim_hooks_for_boost_request = openapi_client.ClaimHookGetClaimHooksForBoostRequest() # ClaimHookGetClaimHooksForBoostRequest | 

    try:
        # Gets Claim Hooks
        api_response = api_instance.claim_hook_get_claim_hooks_for_boost(claim_hook_get_claim_hooks_for_boost_request)
        print("The response of ClaimHooksApi->claim_hook_get_claim_hooks_for_boost:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ClaimHooksApi->claim_hook_get_claim_hooks_for_boost: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **claim_hook_get_claim_hooks_for_boost_request** | [**ClaimHookGetClaimHooksForBoostRequest**](ClaimHookGetClaimHooksForBoostRequest.md)|  | 

### Return type

[**ClaimHookGetClaimHooksForBoost200Response**](ClaimHookGetClaimHooksForBoost200Response.md)

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

