# openapi_client.ProfilesApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**profile_accept_connection_request**](ProfilesApi.md#profile_accept_connection_request) | **POST** /profile/{profileId}/accept-connection | Accept Connection Request
[**profile_block_profile**](ProfilesApi.md#profile_block_profile) | **POST** /profile/{profileId}/block | Block another profile
[**profile_blocked**](ProfilesApi.md#profile_blocked) | **GET** /profile/blocked | View blocked profiles
[**profile_cancel_connection_request**](ProfilesApi.md#profile_cancel_connection_request) | **POST** /profile/{profileId}/cancel-connection-request | Cancel Connection Request
[**profile_connect_with**](ProfilesApi.md#profile_connect_with) | **POST** /profile/{profileId}/connect | Connect with another profile
[**profile_connect_with_invite**](ProfilesApi.md#profile_connect_with_invite) | **POST** /profile/{profileId}/connect/{challenge} | Connect using an invitation
[**profile_connection_requests**](ProfilesApi.md#profile_connection_requests) | **GET** /profile/connection-requests | View connection requests
[**profile_connections**](ProfilesApi.md#profile_connections) | **GET** /profile/connections | View connections
[**profile_create_managed_service_profile**](ProfilesApi.md#profile_create_managed_service_profile) | **POST** /profile/create-managed-service | Create a managed service profile
[**profile_create_profile**](ProfilesApi.md#profile_create_profile) | **POST** /profile/create | Create a profile
[**profile_create_service_profile**](ProfilesApi.md#profile_create_service_profile) | **POST** /profile/create-service | Create a service profile
[**profile_delete_profile**](ProfilesApi.md#profile_delete_profile) | **DELETE** /profile | Delete your profile
[**profile_disconnect_with**](ProfilesApi.md#profile_disconnect_with) | **POST** /profile/{profileId}/disconnect | Disconnect with another profile
[**profile_generate_invite**](ProfilesApi.md#profile_generate_invite) | **POST** /profile/generate-invite | Generate a connection invitation
[**profile_get_available_profiles**](ProfilesApi.md#profile_get_available_profiles) | **POST** /profile/available-profiles | Available Profiles
[**profile_get_managed_service_profiles**](ProfilesApi.md#profile_get_managed_service_profiles) | **GET** /profile/managed-services | Managed Service Profiles
[**profile_get_other_profile**](ProfilesApi.md#profile_get_other_profile) | **GET** /profile/{profileId} | Get profile information
[**profile_get_profile**](ProfilesApi.md#profile_get_profile) | **GET** /profile | Get your profile information
[**profile_manager_create_managed_profile**](ProfilesApi.md#profile_manager_create_managed_profile) | **POST** /profile/create-managed-profile | Create a managed profile
[**profile_manager_get_managed_profiles**](ProfilesApi.md#profile_manager_get_managed_profiles) | **POST** /profile/managed-profiles | Managed Profiles
[**profile_paginated_connection_requests**](ProfilesApi.md#profile_paginated_connection_requests) | **GET** /profile/connection-requests/paginated | View connection requests
[**profile_paginated_connections**](ProfilesApi.md#profile_paginated_connections) | **GET** /profile/connections/paginated | View connections
[**profile_paginated_pending_connections**](ProfilesApi.md#profile_paginated_pending_connections) | **GET** /profile/pending-connections/paginated | View pending connections
[**profile_pending_connections**](ProfilesApi.md#profile_pending_connections) | **GET** /profile/pending-connections | View pending connections
[**profile_primary_signing_authority**](ProfilesApi.md#profile_primary_signing_authority) | **GET** /profile/signing-authority/get-primary | Get primary Signing Authority for user
[**profile_register_signing_authority**](ProfilesApi.md#profile_register_signing_authority) | **POST** /profile/signing-authority/register | Register a Signing Authority
[**profile_search_profiles**](ProfilesApi.md#profile_search_profiles) | **GET** /search/profiles/{input} | Search profiles
[**profile_set_primary_signing_authority**](ProfilesApi.md#profile_set_primary_signing_authority) | **POST** /profile/signing-authority/set-primary | Set Primary Signing Authority
[**profile_signing_authorities**](ProfilesApi.md#profile_signing_authorities) | **GET** /profile/signing-authority/get/all | Get Signing Authorities for user
[**profile_signing_authority**](ProfilesApi.md#profile_signing_authority) | **GET** /profile/signing-authority/get | Get Signing Authority for user
[**profile_unblock_profile**](ProfilesApi.md#profile_unblock_profile) | **POST** /profile/{profileId}/unblock | Unblock another profile
[**profile_update_profile**](ProfilesApi.md#profile_update_profile) | **POST** /profile | Update your profile


# **profile_accept_connection_request**
> bool profile_accept_connection_request(profile_id)

Accept Connection Request

This route uses the request header to accept a connection request from another user based on their profileId

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
    api_instance = openapi_client.ProfilesApi(api_client)
    profile_id = 'profile_id_example' # str | 

    try:
        # Accept Connection Request
        api_response = api_instance.profile_accept_connection_request(profile_id)
        print("The response of ProfilesApi->profile_accept_connection_request:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_accept_connection_request: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_id** | **str**|  | 

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
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **profile_block_profile**
> bool profile_block_profile(profile_id)

Block another profile

Block another user based on their profileId

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
    api_instance = openapi_client.ProfilesApi(api_client)
    profile_id = 'profile_id_example' # str | 

    try:
        # Block another profile
        api_response = api_instance.profile_block_profile(profile_id)
        print("The response of ProfilesApi->profile_block_profile:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_block_profile: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_id** | **str**|  | 

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
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **profile_blocked**
> List[BoostGetBoostRecipients200ResponseInnerTo] profile_blocked()

View blocked profiles

This route shows the current user's blocked profiles

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost_recipients200_response_inner_to import BoostGetBoostRecipients200ResponseInnerTo
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
    api_instance = openapi_client.ProfilesApi(api_client)

    try:
        # View blocked profiles
        api_response = api_instance.profile_blocked()
        print("The response of ProfilesApi->profile_blocked:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_blocked: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**List[BoostGetBoostRecipients200ResponseInnerTo]**](BoostGetBoostRecipients200ResponseInnerTo.md)

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

# **profile_cancel_connection_request**
> bool profile_cancel_connection_request(profile_id)

Cancel Connection Request

Cancels connection request with another profile

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
    api_instance = openapi_client.ProfilesApi(api_client)
    profile_id = 'profile_id_example' # str | 

    try:
        # Cancel Connection Request
        api_response = api_instance.profile_cancel_connection_request(profile_id)
        print("The response of ProfilesApi->profile_cancel_connection_request:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_cancel_connection_request: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_id** | **str**|  | 

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
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **profile_connect_with**
> bool profile_connect_with(profile_id)

Connect with another profile

This route uses the request header to send a connection request to another user based on their profileId

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
    api_instance = openapi_client.ProfilesApi(api_client)
    profile_id = 'profile_id_example' # str | 

    try:
        # Connect with another profile
        api_response = api_instance.profile_connect_with(profile_id)
        print("The response of ProfilesApi->profile_connect_with:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_connect_with: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_id** | **str**|  | 

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
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **profile_connect_with_invite**
> bool profile_connect_with_invite(profile_id, challenge)

Connect using an invitation

Connects with another profile using an invitation challenge

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
    api_instance = openapi_client.ProfilesApi(api_client)
    profile_id = 'profile_id_example' # str | 
    challenge = 'challenge_example' # str | 

    try:
        # Connect using an invitation
        api_response = api_instance.profile_connect_with_invite(profile_id, challenge)
        print("The response of ProfilesApi->profile_connect_with_invite:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_connect_with_invite: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_id** | **str**|  | 
 **challenge** | **str**|  | 

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
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **profile_connection_requests**
> List[BoostGetBoostRecipients200ResponseInnerTo] profile_connection_requests()

View connection requests

This route shows the current user's connection requests.
Warning! This route is deprecated and currently has a hard limit of returning only the first 50 connections. Please use paginatedConnectionRequests instead

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost_recipients200_response_inner_to import BoostGetBoostRecipients200ResponseInnerTo
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
    api_instance = openapi_client.ProfilesApi(api_client)

    try:
        # View connection requests
        api_response = api_instance.profile_connection_requests()
        print("The response of ProfilesApi->profile_connection_requests:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_connection_requests: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**List[BoostGetBoostRecipients200ResponseInnerTo]**](BoostGetBoostRecipients200ResponseInnerTo.md)

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

# **profile_connections**
> List[BoostGetBoostRecipients200ResponseInnerTo] profile_connections()

View connections

This route shows the current user's connections.
Warning! This route is deprecated and currently has a hard limit of returning only the first 50 connections. Please use paginatedConnections instead!

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost_recipients200_response_inner_to import BoostGetBoostRecipients200ResponseInnerTo
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
    api_instance = openapi_client.ProfilesApi(api_client)

    try:
        # View connections
        api_response = api_instance.profile_connections()
        print("The response of ProfilesApi->profile_connections:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_connections: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**List[BoostGetBoostRecipients200ResponseInnerTo]**](BoostGetBoostRecipients200ResponseInnerTo.md)

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

# **profile_create_managed_service_profile**
> str profile_create_managed_service_profile(profile_create_profile_request)

Create a managed service profile

Creates a managed service profile

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.profile_create_profile_request import ProfileCreateProfileRequest
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
    api_instance = openapi_client.ProfilesApi(api_client)
    profile_create_profile_request = openapi_client.ProfileCreateProfileRequest() # ProfileCreateProfileRequest | 

    try:
        # Create a managed service profile
        api_response = api_instance.profile_create_managed_service_profile(profile_create_profile_request)
        print("The response of ProfilesApi->profile_create_managed_service_profile:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_create_managed_service_profile: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_create_profile_request** | [**ProfileCreateProfileRequest**](ProfileCreateProfileRequest.md)|  | 

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

# **profile_create_profile**
> str profile_create_profile(profile_create_profile_request)

Create a profile

Creates a profile for a user

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.profile_create_profile_request import ProfileCreateProfileRequest
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
    api_instance = openapi_client.ProfilesApi(api_client)
    profile_create_profile_request = openapi_client.ProfileCreateProfileRequest() # ProfileCreateProfileRequest | 

    try:
        # Create a profile
        api_response = api_instance.profile_create_profile(profile_create_profile_request)
        print("The response of ProfilesApi->profile_create_profile:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_create_profile: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_create_profile_request** | [**ProfileCreateProfileRequest**](ProfileCreateProfileRequest.md)|  | 

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

# **profile_create_service_profile**
> str profile_create_service_profile(profile_create_profile_request)

Create a service profile

Creates a service profile

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.profile_create_profile_request import ProfileCreateProfileRequest
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
    api_instance = openapi_client.ProfilesApi(api_client)
    profile_create_profile_request = openapi_client.ProfileCreateProfileRequest() # ProfileCreateProfileRequest | 

    try:
        # Create a service profile
        api_response = api_instance.profile_create_service_profile(profile_create_profile_request)
        print("The response of ProfilesApi->profile_create_service_profile:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_create_service_profile: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_create_profile_request** | [**ProfileCreateProfileRequest**](ProfileCreateProfileRequest.md)|  | 

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

# **profile_delete_profile**
> bool profile_delete_profile()

Delete your profile

This route deletes the profile of the current user

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
    api_instance = openapi_client.ProfilesApi(api_client)

    try:
        # Delete your profile
        api_response = api_instance.profile_delete_profile()
        print("The response of ProfilesApi->profile_delete_profile:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_delete_profile: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

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
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **profile_disconnect_with**
> bool profile_disconnect_with(profile_id)

Disconnect with another profile

This route uses the request header to disconnect with another user based on their profileId

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
    api_instance = openapi_client.ProfilesApi(api_client)
    profile_id = 'profile_id_example' # str | 

    try:
        # Disconnect with another profile
        api_response = api_instance.profile_disconnect_with(profile_id)
        print("The response of ProfilesApi->profile_disconnect_with:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_disconnect_with: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_id** | **str**|  | 

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
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **profile_generate_invite**
> ProfileGenerateInvite200Response profile_generate_invite(profile_generate_invite_request=profile_generate_invite_request)

Generate a connection invitation

This route creates a one-time challenge that an unknown profile can use to connect with this account

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.profile_generate_invite200_response import ProfileGenerateInvite200Response
from openapi_client.models.profile_generate_invite_request import ProfileGenerateInviteRequest
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
    api_instance = openapi_client.ProfilesApi(api_client)
    profile_generate_invite_request = openapi_client.ProfileGenerateInviteRequest() # ProfileGenerateInviteRequest |  (optional)

    try:
        # Generate a connection invitation
        api_response = api_instance.profile_generate_invite(profile_generate_invite_request=profile_generate_invite_request)
        print("The response of ProfilesApi->profile_generate_invite:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_generate_invite: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_generate_invite_request** | [**ProfileGenerateInviteRequest**](ProfileGenerateInviteRequest.md)|  | [optional] 

### Return type

[**ProfileGenerateInvite200Response**](ProfileGenerateInvite200Response.md)

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

# **profile_get_available_profiles**
> ProfileGetAvailableProfiles200Response profile_get_available_profiles(profile_get_available_profiles_request=profile_get_available_profiles_request)

Available Profiles

This route gets all of your available profiles. That is, profiles you directly or indirectly manage

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.profile_get_available_profiles200_response import ProfileGetAvailableProfiles200Response
from openapi_client.models.profile_get_available_profiles_request import ProfileGetAvailableProfilesRequest
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
    api_instance = openapi_client.ProfilesApi(api_client)
    profile_get_available_profiles_request = openapi_client.ProfileGetAvailableProfilesRequest() # ProfileGetAvailableProfilesRequest |  (optional)

    try:
        # Available Profiles
        api_response = api_instance.profile_get_available_profiles(profile_get_available_profiles_request=profile_get_available_profiles_request)
        print("The response of ProfilesApi->profile_get_available_profiles:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_get_available_profiles: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_get_available_profiles_request** | [**ProfileGetAvailableProfilesRequest**](ProfileGetAvailableProfilesRequest.md)|  | [optional] 

### Return type

[**ProfileGetAvailableProfiles200Response**](ProfileGetAvailableProfiles200Response.md)

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

# **profile_get_managed_service_profiles**
> BoostGetBoostAdmins200Response profile_get_managed_service_profiles(limit=limit, cursor=cursor, sort=sort, id=id)

Managed Service Profiles

This route gets all of your managed service profiles

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost_admins200_response import BoostGetBoostAdmins200Response
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
    api_instance = openapi_client.ProfilesApi(api_client)
    limit = 25 # float |  (optional) (default to 25)
    cursor = 'cursor_example' # str |  (optional)
    sort = 'sort_example' # str |  (optional)
    id = 'id_example' # str |  (optional)

    try:
        # Managed Service Profiles
        api_response = api_instance.profile_get_managed_service_profiles(limit=limit, cursor=cursor, sort=sort, id=id)
        print("The response of ProfilesApi->profile_get_managed_service_profiles:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_get_managed_service_profiles: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **float**|  | [optional] [default to 25]
 **cursor** | **str**|  | [optional] 
 **sort** | **str**|  | [optional] 
 **id** | **str**|  | [optional] 

### Return type

[**BoostGetBoostAdmins200Response**](BoostGetBoostAdmins200Response.md)

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

# **profile_get_other_profile**
> BoostGetBoostRecipients200ResponseInnerTo profile_get_other_profile(profile_id)

Get profile information

This route grabs the profile information of any user, using their profileId

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost_recipients200_response_inner_to import BoostGetBoostRecipients200ResponseInnerTo
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
    api_instance = openapi_client.ProfilesApi(api_client)
    profile_id = 'profile_id_example' # str | 

    try:
        # Get profile information
        api_response = api_instance.profile_get_other_profile(profile_id)
        print("The response of ProfilesApi->profile_get_other_profile:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_get_other_profile: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_id** | **str**|  | 

### Return type

[**BoostGetBoostRecipients200ResponseInnerTo**](BoostGetBoostRecipients200ResponseInnerTo.md)

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

# **profile_get_profile**
> BoostGetBoostRecipients200ResponseInnerTo profile_get_profile()

Get your profile information

This route uses the request header to grab the profile of the current user

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost_recipients200_response_inner_to import BoostGetBoostRecipients200ResponseInnerTo
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
    api_instance = openapi_client.ProfilesApi(api_client)

    try:
        # Get your profile information
        api_response = api_instance.profile_get_profile()
        print("The response of ProfilesApi->profile_get_profile:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_get_profile: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**BoostGetBoostRecipients200ResponseInnerTo**](BoostGetBoostRecipients200ResponseInnerTo.md)

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

# **profile_manager_create_managed_profile**
> str profile_manager_create_managed_profile(profile_manager_create_managed_profile_request)

Create a managed profile

Creates a managed profile

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.profile_manager_create_managed_profile_request import ProfileManagerCreateManagedProfileRequest
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
    api_instance = openapi_client.ProfilesApi(api_client)
    profile_manager_create_managed_profile_request = openapi_client.ProfileManagerCreateManagedProfileRequest() # ProfileManagerCreateManagedProfileRequest | 

    try:
        # Create a managed profile
        api_response = api_instance.profile_manager_create_managed_profile(profile_manager_create_managed_profile_request)
        print("The response of ProfilesApi->profile_manager_create_managed_profile:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_manager_create_managed_profile: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_manager_create_managed_profile_request** | [**ProfileManagerCreateManagedProfileRequest**](ProfileManagerCreateManagedProfileRequest.md)|  | 

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

# **profile_manager_get_managed_profiles**
> BoostGetBoostAdmins200Response profile_manager_get_managed_profiles(profile_get_available_profiles_request=profile_get_available_profiles_request)

Managed Profiles

This route gets all of your managed profiles

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost_admins200_response import BoostGetBoostAdmins200Response
from openapi_client.models.profile_get_available_profiles_request import ProfileGetAvailableProfilesRequest
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
    api_instance = openapi_client.ProfilesApi(api_client)
    profile_get_available_profiles_request = openapi_client.ProfileGetAvailableProfilesRequest() # ProfileGetAvailableProfilesRequest |  (optional)

    try:
        # Managed Profiles
        api_response = api_instance.profile_manager_get_managed_profiles(profile_get_available_profiles_request=profile_get_available_profiles_request)
        print("The response of ProfilesApi->profile_manager_get_managed_profiles:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_manager_get_managed_profiles: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_get_available_profiles_request** | [**ProfileGetAvailableProfilesRequest**](ProfileGetAvailableProfilesRequest.md)|  | [optional] 

### Return type

[**BoostGetBoostAdmins200Response**](BoostGetBoostAdmins200Response.md)

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

# **profile_paginated_connection_requests**
> BoostGetBoostAdmins200Response profile_paginated_connection_requests(limit=limit, cursor=cursor, sort=sort)

View connection requests

This route shows the current user's connection requests

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost_admins200_response import BoostGetBoostAdmins200Response
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
    api_instance = openapi_client.ProfilesApi(api_client)
    limit = 25 # float |  (optional) (default to 25)
    cursor = 'cursor_example' # str |  (optional)
    sort = 'sort_example' # str |  (optional)

    try:
        # View connection requests
        api_response = api_instance.profile_paginated_connection_requests(limit=limit, cursor=cursor, sort=sort)
        print("The response of ProfilesApi->profile_paginated_connection_requests:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_paginated_connection_requests: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **float**|  | [optional] [default to 25]
 **cursor** | **str**|  | [optional] 
 **sort** | **str**|  | [optional] 

### Return type

[**BoostGetBoostAdmins200Response**](BoostGetBoostAdmins200Response.md)

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

# **profile_paginated_connections**
> BoostGetBoostAdmins200Response profile_paginated_connections(limit=limit, cursor=cursor, sort=sort)

View connections

This route shows the current user's connections

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost_admins200_response import BoostGetBoostAdmins200Response
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
    api_instance = openapi_client.ProfilesApi(api_client)
    limit = 25 # float |  (optional) (default to 25)
    cursor = 'cursor_example' # str |  (optional)
    sort = 'sort_example' # str |  (optional)

    try:
        # View connections
        api_response = api_instance.profile_paginated_connections(limit=limit, cursor=cursor, sort=sort)
        print("The response of ProfilesApi->profile_paginated_connections:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_paginated_connections: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **float**|  | [optional] [default to 25]
 **cursor** | **str**|  | [optional] 
 **sort** | **str**|  | [optional] 

### Return type

[**BoostGetBoostAdmins200Response**](BoostGetBoostAdmins200Response.md)

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

# **profile_paginated_pending_connections**
> BoostGetBoostAdmins200Response profile_paginated_pending_connections(limit=limit, cursor=cursor, sort=sort)

View pending connections

This route shows the current user's pending connections

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost_admins200_response import BoostGetBoostAdmins200Response
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
    api_instance = openapi_client.ProfilesApi(api_client)
    limit = 25 # float |  (optional) (default to 25)
    cursor = 'cursor_example' # str |  (optional)
    sort = 'sort_example' # str |  (optional)

    try:
        # View pending connections
        api_response = api_instance.profile_paginated_pending_connections(limit=limit, cursor=cursor, sort=sort)
        print("The response of ProfilesApi->profile_paginated_pending_connections:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_paginated_pending_connections: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **float**|  | [optional] [default to 25]
 **cursor** | **str**|  | [optional] 
 **sort** | **str**|  | [optional] 

### Return type

[**BoostGetBoostAdmins200Response**](BoostGetBoostAdmins200Response.md)

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

# **profile_pending_connections**
> List[BoostGetBoostRecipients200ResponseInnerTo] profile_pending_connections()

View pending connections

This route shows the current user's pending connections.
Warning! This route is deprecated and currently has a hard limit of returning only the first 50 connections. Please use paginatedPendingConnections instead

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost_recipients200_response_inner_to import BoostGetBoostRecipients200ResponseInnerTo
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
    api_instance = openapi_client.ProfilesApi(api_client)

    try:
        # View pending connections
        api_response = api_instance.profile_pending_connections()
        print("The response of ProfilesApi->profile_pending_connections:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_pending_connections: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**List[BoostGetBoostRecipients200ResponseInnerTo]**](BoostGetBoostRecipients200ResponseInnerTo.md)

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

# **profile_primary_signing_authority**
> ProfileSigningAuthorities200ResponseInner profile_primary_signing_authority()

Get primary Signing Authority for user

This route is used to get the primary signing authority that can sign credentials on the current user's behalf

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.profile_signing_authorities200_response_inner import ProfileSigningAuthorities200ResponseInner
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
    api_instance = openapi_client.ProfilesApi(api_client)

    try:
        # Get primary Signing Authority for user
        api_response = api_instance.profile_primary_signing_authority()
        print("The response of ProfilesApi->profile_primary_signing_authority:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_primary_signing_authority: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**ProfileSigningAuthorities200ResponseInner**](ProfileSigningAuthorities200ResponseInner.md)

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

# **profile_register_signing_authority**
> bool profile_register_signing_authority(profile_register_signing_authority_request)

Register a Signing Authority

This route is used to register a signing authority that can sign credentials on the current user's behalf

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.profile_register_signing_authority_request import ProfileRegisterSigningAuthorityRequest
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
    api_instance = openapi_client.ProfilesApi(api_client)
    profile_register_signing_authority_request = openapi_client.ProfileRegisterSigningAuthorityRequest() # ProfileRegisterSigningAuthorityRequest | 

    try:
        # Register a Signing Authority
        api_response = api_instance.profile_register_signing_authority(profile_register_signing_authority_request)
        print("The response of ProfilesApi->profile_register_signing_authority:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_register_signing_authority: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_register_signing_authority_request** | [**ProfileRegisterSigningAuthorityRequest**](ProfileRegisterSigningAuthorityRequest.md)|  | 

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

# **profile_search_profiles**
> List[ProfileSearchProfiles200ResponseInner] profile_search_profiles(input, limit=limit, include_self=include_self, include_connection_status=include_connection_status, include_service_profiles=include_service_profiles)

Search profiles

This route searches for profiles based on their profileId

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.profile_search_profiles200_response_inner import ProfileSearchProfiles200ResponseInner
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
    api_instance = openapi_client.ProfilesApi(api_client)
    input = 'input_example' # str | 
    limit = 25 # int |  (optional) (default to 25)
    include_self = False # bool |  (optional) (default to False)
    include_connection_status = False # bool |  (optional) (default to False)
    include_service_profiles = False # bool |  (optional) (default to False)

    try:
        # Search profiles
        api_response = api_instance.profile_search_profiles(input, limit=limit, include_self=include_self, include_connection_status=include_connection_status, include_service_profiles=include_service_profiles)
        print("The response of ProfilesApi->profile_search_profiles:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_search_profiles: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **input** | **str**|  | 
 **limit** | **int**|  | [optional] [default to 25]
 **include_self** | **bool**|  | [optional] [default to False]
 **include_connection_status** | **bool**|  | [optional] [default to False]
 **include_service_profiles** | **bool**|  | [optional] [default to False]

### Return type

[**List[ProfileSearchProfiles200ResponseInner]**](ProfileSearchProfiles200ResponseInner.md)

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

# **profile_set_primary_signing_authority**
> bool profile_set_primary_signing_authority(profile_set_primary_signing_authority_request)

Set Primary Signing Authority

This route is used to set a signing authority as the primary one for the current user

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.profile_set_primary_signing_authority_request import ProfileSetPrimarySigningAuthorityRequest
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
    api_instance = openapi_client.ProfilesApi(api_client)
    profile_set_primary_signing_authority_request = openapi_client.ProfileSetPrimarySigningAuthorityRequest() # ProfileSetPrimarySigningAuthorityRequest | 

    try:
        # Set Primary Signing Authority
        api_response = api_instance.profile_set_primary_signing_authority(profile_set_primary_signing_authority_request)
        print("The response of ProfilesApi->profile_set_primary_signing_authority:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_set_primary_signing_authority: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_set_primary_signing_authority_request** | [**ProfileSetPrimarySigningAuthorityRequest**](ProfileSetPrimarySigningAuthorityRequest.md)|  | 

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

# **profile_signing_authorities**
> List[ProfileSigningAuthorities200ResponseInner] profile_signing_authorities()

Get Signing Authorities for user

This route is used to get registered signing authorities that can sign credentials on the current user's behalf

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.profile_signing_authorities200_response_inner import ProfileSigningAuthorities200ResponseInner
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
    api_instance = openapi_client.ProfilesApi(api_client)

    try:
        # Get Signing Authorities for user
        api_response = api_instance.profile_signing_authorities()
        print("The response of ProfilesApi->profile_signing_authorities:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_signing_authorities: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**List[ProfileSigningAuthorities200ResponseInner]**](ProfileSigningAuthorities200ResponseInner.md)

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

# **profile_signing_authority**
> ProfileSigningAuthorities200ResponseInner profile_signing_authority(endpoint, name)

Get Signing Authority for user

This route is used to get a named signing authority that can sign credentials on the current user's behalf

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.profile_signing_authorities200_response_inner import ProfileSigningAuthorities200ResponseInner
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
    api_instance = openapi_client.ProfilesApi(api_client)
    endpoint = 'endpoint_example' # str | 
    name = 'name_example' # str | 

    try:
        # Get Signing Authority for user
        api_response = api_instance.profile_signing_authority(endpoint, name)
        print("The response of ProfilesApi->profile_signing_authority:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_signing_authority: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **endpoint** | **str**|  | 
 **name** | **str**|  | 

### Return type

[**ProfileSigningAuthorities200ResponseInner**](ProfileSigningAuthorities200ResponseInner.md)

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

# **profile_unblock_profile**
> bool profile_unblock_profile(profile_id)

Unblock another profile

Unblock another user based on their profileId

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
    api_instance = openapi_client.ProfilesApi(api_client)
    profile_id = 'profile_id_example' # str | 

    try:
        # Unblock another profile
        api_response = api_instance.profile_unblock_profile(profile_id)
        print("The response of ProfilesApi->profile_unblock_profile:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_unblock_profile: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_id** | **str**|  | 

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
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **profile_update_profile**
> bool profile_update_profile(profile_update_profile_request)

Update your profile

This route updates the profile of the current user

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.profile_update_profile_request import ProfileUpdateProfileRequest
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
    api_instance = openapi_client.ProfilesApi(api_client)
    profile_update_profile_request = openapi_client.ProfileUpdateProfileRequest() # ProfileUpdateProfileRequest | 

    try:
        # Update your profile
        api_response = api_instance.profile_update_profile(profile_update_profile_request)
        print("The response of ProfilesApi->profile_update_profile:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfilesApi->profile_update_profile: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_update_profile_request** | [**ProfileUpdateProfileRequest**](ProfileUpdateProfileRequest.md)|  | 

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

