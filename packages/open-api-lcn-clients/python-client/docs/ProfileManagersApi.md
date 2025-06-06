# openapi_client.ProfileManagersApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**boost_get_children_profile_managers**](ProfileManagersApi.md#boost_get_children_profile_managers) | **POST** /boost/children-profile-managers | Get Profile Managers that are a child of a boost
[**profile_manager_create_child_profile_manager**](ProfileManagersApi.md#profile_manager_create_child_profile_manager) | **POST** /profile-manager/create-child | Create a profile manager that is a child of a Boost
[**profile_manager_create_managed_profile**](ProfileManagersApi.md#profile_manager_create_managed_profile) | **POST** /profile/create-managed-profile | Create a managed profile
[**profile_manager_create_profile_manager**](ProfileManagersApi.md#profile_manager_create_profile_manager) | **POST** /profile-manager/create | Create a profile manager
[**profile_manager_get_managed_profiles**](ProfileManagersApi.md#profile_manager_get_managed_profiles) | **POST** /profile/managed-profiles | Managed Profiles
[**profile_manager_get_other_profile_manager**](ProfileManagersApi.md#profile_manager_get_other_profile_manager) | **GET** /profile-manager/{id} | Get profile manager information
[**profile_manager_get_profile_manager**](ProfileManagersApi.md#profile_manager_get_profile_manager) | **GET** /profile-manager | Get your profile manager profile information
[**profile_manager_update_profile_manager**](ProfileManagersApi.md#profile_manager_update_profile_manager) | **POST** /profile-manager | Update the profile of your Profile Manager


# **boost_get_children_profile_managers**
> BoostGetChildrenProfileManagers200Response boost_get_children_profile_managers(boost_get_children_profile_managers_request)

Get Profile Managers that are a child of a boost

Get Profile Managers that are a child of a boost

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_children_profile_managers200_response import BoostGetChildrenProfileManagers200Response
from openapi_client.models.boost_get_children_profile_managers_request import BoostGetChildrenProfileManagersRequest
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
    api_instance = openapi_client.ProfileManagersApi(api_client)
    boost_get_children_profile_managers_request = openapi_client.BoostGetChildrenProfileManagersRequest() # BoostGetChildrenProfileManagersRequest | 

    try:
        # Get Profile Managers that are a child of a boost
        api_response = api_instance.boost_get_children_profile_managers(boost_get_children_profile_managers_request)
        print("The response of ProfileManagersApi->boost_get_children_profile_managers:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfileManagersApi->boost_get_children_profile_managers: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_get_children_profile_managers_request** | [**BoostGetChildrenProfileManagersRequest**](BoostGetChildrenProfileManagersRequest.md)|  | 

### Return type

[**BoostGetChildrenProfileManagers200Response**](BoostGetChildrenProfileManagers200Response.md)

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

# **profile_manager_create_child_profile_manager**
> str profile_manager_create_child_profile_manager(profile_manager_create_child_profile_manager_request)

Create a profile manager that is a child of a Boost

Creates a profile manager that is a child of a Boost

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.profile_manager_create_child_profile_manager_request import ProfileManagerCreateChildProfileManagerRequest
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
    api_instance = openapi_client.ProfileManagersApi(api_client)
    profile_manager_create_child_profile_manager_request = openapi_client.ProfileManagerCreateChildProfileManagerRequest() # ProfileManagerCreateChildProfileManagerRequest | 

    try:
        # Create a profile manager that is a child of a Boost
        api_response = api_instance.profile_manager_create_child_profile_manager(profile_manager_create_child_profile_manager_request)
        print("The response of ProfileManagersApi->profile_manager_create_child_profile_manager:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfileManagersApi->profile_manager_create_child_profile_manager: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_manager_create_child_profile_manager_request** | [**ProfileManagerCreateChildProfileManagerRequest**](ProfileManagerCreateChildProfileManagerRequest.md)|  | 

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
    api_instance = openapi_client.ProfileManagersApi(api_client)
    profile_manager_create_managed_profile_request = openapi_client.ProfileManagerCreateManagedProfileRequest() # ProfileManagerCreateManagedProfileRequest | 

    try:
        # Create a managed profile
        api_response = api_instance.profile_manager_create_managed_profile(profile_manager_create_managed_profile_request)
        print("The response of ProfileManagersApi->profile_manager_create_managed_profile:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfileManagersApi->profile_manager_create_managed_profile: %s\n" % e)
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

# **profile_manager_create_profile_manager**
> str profile_manager_create_profile_manager(profile_manager_create_profile_manager_request)

Create a profile manager

Creates a profile manager

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.profile_manager_create_profile_manager_request import ProfileManagerCreateProfileManagerRequest
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
    api_instance = openapi_client.ProfileManagersApi(api_client)
    profile_manager_create_profile_manager_request = openapi_client.ProfileManagerCreateProfileManagerRequest() # ProfileManagerCreateProfileManagerRequest | 

    try:
        # Create a profile manager
        api_response = api_instance.profile_manager_create_profile_manager(profile_manager_create_profile_manager_request)
        print("The response of ProfileManagersApi->profile_manager_create_profile_manager:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfileManagersApi->profile_manager_create_profile_manager: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_manager_create_profile_manager_request** | [**ProfileManagerCreateProfileManagerRequest**](ProfileManagerCreateProfileManagerRequest.md)|  | 

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
    api_instance = openapi_client.ProfileManagersApi(api_client)
    profile_get_available_profiles_request = openapi_client.ProfileGetAvailableProfilesRequest() # ProfileGetAvailableProfilesRequest |  (optional)

    try:
        # Managed Profiles
        api_response = api_instance.profile_manager_get_managed_profiles(profile_get_available_profiles_request=profile_get_available_profiles_request)
        print("The response of ProfileManagersApi->profile_manager_get_managed_profiles:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfileManagersApi->profile_manager_get_managed_profiles: %s\n" % e)
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

# **profile_manager_get_other_profile_manager**
> BoostGetChildrenProfileManagers200ResponseRecordsInner profile_manager_get_other_profile_manager(id)

Get profile manager information

This route grabs the profile information of any profile manager, using their id

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_children_profile_managers200_response_records_inner import BoostGetChildrenProfileManagers200ResponseRecordsInner
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
    api_instance = openapi_client.ProfileManagersApi(api_client)
    id = 'id_example' # str | 

    try:
        # Get profile manager information
        api_response = api_instance.profile_manager_get_other_profile_manager(id)
        print("The response of ProfileManagersApi->profile_manager_get_other_profile_manager:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfileManagersApi->profile_manager_get_other_profile_manager: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 

### Return type

[**BoostGetChildrenProfileManagers200ResponseRecordsInner**](BoostGetChildrenProfileManagers200ResponseRecordsInner.md)

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

# **profile_manager_get_profile_manager**
> BoostGetChildrenProfileManagers200ResponseRecordsInner profile_manager_get_profile_manager()

Get your profile manager profile information

This route uses the request header to grab the profile manager profile of the current profile manager

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_children_profile_managers200_response_records_inner import BoostGetChildrenProfileManagers200ResponseRecordsInner
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
    api_instance = openapi_client.ProfileManagersApi(api_client)

    try:
        # Get your profile manager profile information
        api_response = api_instance.profile_manager_get_profile_manager()
        print("The response of ProfileManagersApi->profile_manager_get_profile_manager:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfileManagersApi->profile_manager_get_profile_manager: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**BoostGetChildrenProfileManagers200ResponseRecordsInner**](BoostGetChildrenProfileManagers200ResponseRecordsInner.md)

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

# **profile_manager_update_profile_manager**
> bool profile_manager_update_profile_manager(profile_manager_create_profile_manager_request)

Update the profile of your Profile Manager

This route updates the profile of the current profile manager

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.profile_manager_create_profile_manager_request import ProfileManagerCreateProfileManagerRequest
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
    api_instance = openapi_client.ProfileManagersApi(api_client)
    profile_manager_create_profile_manager_request = openapi_client.ProfileManagerCreateProfileManagerRequest() # ProfileManagerCreateProfileManagerRequest | 

    try:
        # Update the profile of your Profile Manager
        api_response = api_instance.profile_manager_update_profile_manager(profile_manager_create_profile_manager_request)
        print("The response of ProfileManagersApi->profile_manager_update_profile_manager:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ProfileManagersApi->profile_manager_update_profile_manager: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_manager_create_profile_manager_request** | [**ProfileManagerCreateProfileManagerRequest**](ProfileManagerCreateProfileManagerRequest.md)|  | 

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

