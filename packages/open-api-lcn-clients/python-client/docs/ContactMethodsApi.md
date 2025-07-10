# openapi_client.ContactMethodsApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**contact_methods_add_contact_method**](ContactMethodsApi.md#contact_methods_add_contact_method) | **POST** /profile/contact-methods/add | Add Contact Method
[**contact_methods_get_my_contact_methods**](ContactMethodsApi.md#contact_methods_get_my_contact_methods) | **GET** /profile/contact-methods | Get My Contact Methods
[**contact_methods_remove_contact_method**](ContactMethodsApi.md#contact_methods_remove_contact_method) | **POST** /profile/contact-methods/remove | Remove Contact Method
[**contact_methods_set_primary_contact_method**](ContactMethodsApi.md#contact_methods_set_primary_contact_method) | **POST** /profile/contact-methods/set-primary | Set Primary Contact Method
[**contact_methods_verify_contact_method**](ContactMethodsApi.md#contact_methods_verify_contact_method) | **POST** /profile/contact-methods/verify | Verify Contact Method


# **contact_methods_add_contact_method**
> ContactMethodsAddContactMethod200Response contact_methods_add_contact_method(contact_methods_add_contact_method_request)

Add Contact Method

Add a new contact method to the profile (requires verification)

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contact_methods_add_contact_method200_response import ContactMethodsAddContactMethod200Response
from openapi_client.models.contact_methods_add_contact_method_request import ContactMethodsAddContactMethodRequest
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
    api_instance = openapi_client.ContactMethodsApi(api_client)
    contact_methods_add_contact_method_request = openapi_client.ContactMethodsAddContactMethodRequest() # ContactMethodsAddContactMethodRequest | 

    try:
        # Add Contact Method
        api_response = api_instance.contact_methods_add_contact_method(contact_methods_add_contact_method_request)
        print("The response of ContactMethodsApi->contact_methods_add_contact_method:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContactMethodsApi->contact_methods_add_contact_method: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contact_methods_add_contact_method_request** | [**ContactMethodsAddContactMethodRequest**](ContactMethodsAddContactMethodRequest.md)|  | 

### Return type

[**ContactMethodsAddContactMethod200Response**](ContactMethodsAddContactMethod200Response.md)

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

# **contact_methods_get_my_contact_methods**
> List[ContactMethodsGetMyContactMethods200ResponseInner] contact_methods_get_my_contact_methods()

Get My Contact Methods

Get all contact methods associated with the authenticated profile

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contact_methods_get_my_contact_methods200_response_inner import ContactMethodsGetMyContactMethods200ResponseInner
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
    api_instance = openapi_client.ContactMethodsApi(api_client)

    try:
        # Get My Contact Methods
        api_response = api_instance.contact_methods_get_my_contact_methods()
        print("The response of ContactMethodsApi->contact_methods_get_my_contact_methods:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContactMethodsApi->contact_methods_get_my_contact_methods: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**List[ContactMethodsGetMyContactMethods200ResponseInner]**](ContactMethodsGetMyContactMethods200ResponseInner.md)

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

# **contact_methods_remove_contact_method**
> ContactMethodsSetPrimaryContactMethod200Response contact_methods_remove_contact_method(claim_hook_delete_claim_hook_request)

Remove Contact Method

Remove a contact method from the profile

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.claim_hook_delete_claim_hook_request import ClaimHookDeleteClaimHookRequest
from openapi_client.models.contact_methods_set_primary_contact_method200_response import ContactMethodsSetPrimaryContactMethod200Response
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
    api_instance = openapi_client.ContactMethodsApi(api_client)
    claim_hook_delete_claim_hook_request = openapi_client.ClaimHookDeleteClaimHookRequest() # ClaimHookDeleteClaimHookRequest | 

    try:
        # Remove Contact Method
        api_response = api_instance.contact_methods_remove_contact_method(claim_hook_delete_claim_hook_request)
        print("The response of ContactMethodsApi->contact_methods_remove_contact_method:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContactMethodsApi->contact_methods_remove_contact_method: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **claim_hook_delete_claim_hook_request** | [**ClaimHookDeleteClaimHookRequest**](ClaimHookDeleteClaimHookRequest.md)|  | 

### Return type

[**ContactMethodsSetPrimaryContactMethod200Response**](ContactMethodsSetPrimaryContactMethod200Response.md)

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

# **contact_methods_set_primary_contact_method**
> ContactMethodsSetPrimaryContactMethod200Response contact_methods_set_primary_contact_method(contact_methods_set_primary_contact_method_request)

Set Primary Contact Method

Set a contact method as the primary one for the profile

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contact_methods_set_primary_contact_method200_response import ContactMethodsSetPrimaryContactMethod200Response
from openapi_client.models.contact_methods_set_primary_contact_method_request import ContactMethodsSetPrimaryContactMethodRequest
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
    api_instance = openapi_client.ContactMethodsApi(api_client)
    contact_methods_set_primary_contact_method_request = openapi_client.ContactMethodsSetPrimaryContactMethodRequest() # ContactMethodsSetPrimaryContactMethodRequest | 

    try:
        # Set Primary Contact Method
        api_response = api_instance.contact_methods_set_primary_contact_method(contact_methods_set_primary_contact_method_request)
        print("The response of ContactMethodsApi->contact_methods_set_primary_contact_method:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContactMethodsApi->contact_methods_set_primary_contact_method: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contact_methods_set_primary_contact_method_request** | [**ContactMethodsSetPrimaryContactMethodRequest**](ContactMethodsSetPrimaryContactMethodRequest.md)|  | 

### Return type

[**ContactMethodsSetPrimaryContactMethod200Response**](ContactMethodsSetPrimaryContactMethod200Response.md)

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

# **contact_methods_verify_contact_method**
> ContactMethodsVerifyContactMethod200Response contact_methods_verify_contact_method(contact_methods_verify_contact_method_request)

Verify Contact Method

Verify a contact method using the verification token

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contact_methods_verify_contact_method200_response import ContactMethodsVerifyContactMethod200Response
from openapi_client.models.contact_methods_verify_contact_method_request import ContactMethodsVerifyContactMethodRequest
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
    api_instance = openapi_client.ContactMethodsApi(api_client)
    contact_methods_verify_contact_method_request = openapi_client.ContactMethodsVerifyContactMethodRequest() # ContactMethodsVerifyContactMethodRequest | 

    try:
        # Verify Contact Method
        api_response = api_instance.contact_methods_verify_contact_method(contact_methods_verify_contact_method_request)
        print("The response of ContactMethodsApi->contact_methods_verify_contact_method:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContactMethodsApi->contact_methods_verify_contact_method: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contact_methods_verify_contact_method_request** | [**ContactMethodsVerifyContactMethodRequest**](ContactMethodsVerifyContactMethodRequest.md)|  | 

### Return type

[**ContactMethodsVerifyContactMethod200Response**](ContactMethodsVerifyContactMethod200Response.md)

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

