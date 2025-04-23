# openapi_client.AuthGrantsApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**auth_grants_add_auth_grant**](AuthGrantsApi.md#auth_grants_add_auth_grant) | **POST** /auth-grant/create | Add AuthGrant to your profile
[**auth_grants_delete_auth_grant**](AuthGrantsApi.md#auth_grants_delete_auth_grant) | **DELETE** /auth-grant/{id} | Delete AuthGrant
[**auth_grants_get_auth_grant**](AuthGrantsApi.md#auth_grants_get_auth_grant) | **GET** /auth-grant/{id} | Get AuthGrant
[**auth_grants_get_auth_grants**](AuthGrantsApi.md#auth_grants_get_auth_grants) | **POST** /profile/auth-grants | Get My AuthGrants
[**auth_grants_revoke_auth_grant**](AuthGrantsApi.md#auth_grants_revoke_auth_grant) | **POST** /auth-grant/{id}/revoke | Revoke AuthGrant
[**auth_grants_update_auth_grant**](AuthGrantsApi.md#auth_grants_update_auth_grant) | **POST** /auth-grant/update/{id} | Update AuthGrant


# **auth_grants_add_auth_grant**
> str auth_grants_add_auth_grant(auth_grants_add_auth_grant_request)

Add AuthGrant to your profile

Add AuthGrant to your profile

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.auth_grants_add_auth_grant_request import AuthGrantsAddAuthGrantRequest
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
    api_instance = openapi_client.AuthGrantsApi(api_client)
    auth_grants_add_auth_grant_request = openapi_client.AuthGrantsAddAuthGrantRequest() # AuthGrantsAddAuthGrantRequest | 

    try:
        # Add AuthGrant to your profile
        api_response = api_instance.auth_grants_add_auth_grant(auth_grants_add_auth_grant_request)
        print("The response of AuthGrantsApi->auth_grants_add_auth_grant:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AuthGrantsApi->auth_grants_add_auth_grant: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **auth_grants_add_auth_grant_request** | [**AuthGrantsAddAuthGrantRequest**](AuthGrantsAddAuthGrantRequest.md)|  | 

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
**0** | Error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

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
    api_instance = openapi_client.AuthGrantsApi(api_client)
    id = 'id_example' # str | 

    try:
        # Delete AuthGrant
        api_response = api_instance.auth_grants_delete_auth_grant(id)
        print("The response of AuthGrantsApi->auth_grants_delete_auth_grant:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AuthGrantsApi->auth_grants_delete_auth_grant: %s\n" % e)
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

# **auth_grants_get_auth_grant**
> AuthGrantsGetAuthGrant200Response auth_grants_get_auth_grant(id)

Get AuthGrant

Get AuthGrant

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.auth_grants_get_auth_grant200_response import AuthGrantsGetAuthGrant200Response
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
    api_instance = openapi_client.AuthGrantsApi(api_client)
    id = 'id_example' # str | 

    try:
        # Get AuthGrant
        api_response = api_instance.auth_grants_get_auth_grant(id)
        print("The response of AuthGrantsApi->auth_grants_get_auth_grant:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AuthGrantsApi->auth_grants_get_auth_grant: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 

### Return type

[**AuthGrantsGetAuthGrant200Response**](AuthGrantsGetAuthGrant200Response.md)

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

# **auth_grants_get_auth_grants**
> List[AuthGrantsGetAuthGrants200ResponseInner] auth_grants_get_auth_grants(auth_grants_get_auth_grants_request=auth_grants_get_auth_grants_request)

Get My AuthGrants

Get My AuthGrants

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.auth_grants_get_auth_grants200_response_inner import AuthGrantsGetAuthGrants200ResponseInner
from openapi_client.models.auth_grants_get_auth_grants_request import AuthGrantsGetAuthGrantsRequest
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
    api_instance = openapi_client.AuthGrantsApi(api_client)
    auth_grants_get_auth_grants_request = openapi_client.AuthGrantsGetAuthGrantsRequest() # AuthGrantsGetAuthGrantsRequest |  (optional)

    try:
        # Get My AuthGrants
        api_response = api_instance.auth_grants_get_auth_grants(auth_grants_get_auth_grants_request=auth_grants_get_auth_grants_request)
        print("The response of AuthGrantsApi->auth_grants_get_auth_grants:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AuthGrantsApi->auth_grants_get_auth_grants: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **auth_grants_get_auth_grants_request** | [**AuthGrantsGetAuthGrantsRequest**](AuthGrantsGetAuthGrantsRequest.md)|  | [optional] 

### Return type

[**List[AuthGrantsGetAuthGrants200ResponseInner]**](AuthGrantsGetAuthGrants200ResponseInner.md)

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

# **auth_grants_revoke_auth_grant**
> bool auth_grants_revoke_auth_grant(id)

Revoke AuthGrant

Revoke AuthGrant

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
    api_instance = openapi_client.AuthGrantsApi(api_client)
    id = 'id_example' # str | 

    try:
        # Revoke AuthGrant
        api_response = api_instance.auth_grants_revoke_auth_grant(id)
        print("The response of AuthGrantsApi->auth_grants_revoke_auth_grant:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AuthGrantsApi->auth_grants_revoke_auth_grant: %s\n" % e)
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

# **auth_grants_update_auth_grant**
> bool auth_grants_update_auth_grant(id, auth_grants_update_auth_grant_request)

Update AuthGrant

Update AuthGrant

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.auth_grants_update_auth_grant_request import AuthGrantsUpdateAuthGrantRequest
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
    api_instance = openapi_client.AuthGrantsApi(api_client)
    id = 'id_example' # str | 
    auth_grants_update_auth_grant_request = openapi_client.AuthGrantsUpdateAuthGrantRequest() # AuthGrantsUpdateAuthGrantRequest | 

    try:
        # Update AuthGrant
        api_response = api_instance.auth_grants_update_auth_grant(id, auth_grants_update_auth_grant_request)
        print("The response of AuthGrantsApi->auth_grants_update_auth_grant:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling AuthGrantsApi->auth_grants_update_auth_grant: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 
 **auth_grants_update_auth_grant_request** | [**AuthGrantsUpdateAuthGrantRequest**](AuthGrantsUpdateAuthGrantRequest.md)|  | 

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

