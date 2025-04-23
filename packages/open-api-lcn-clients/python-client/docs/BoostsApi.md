# openapi_client.BoostsApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**boost_add_boost_admin**](BoostsApi.md#boost_add_boost_admin) | **POST** /boost/add-admin | Add a Boost admin
[**boost_claim_boost_with_link**](BoostsApi.md#boost_claim_boost_with_link) | **POST** /boost/claim | Claim a boost using a claim link
[**boost_count_boost_children**](BoostsApi.md#boost_count_boost_children) | **POST** /boost/children/count | Count boost children
[**boost_count_boost_parents**](BoostsApi.md#boost_count_boost_parents) | **POST** /boost/parents/count | Count boost parents
[**boost_count_boost_siblings**](BoostsApi.md#boost_count_boost_siblings) | **POST** /boost/siblings/count | Count boost siblings
[**boost_count_boosts**](BoostsApi.md#boost_count_boosts) | **POST** /boost/count | Count managed boosts
[**boost_count_familial_boosts**](BoostsApi.md#boost_count_familial_boosts) | **POST** /boost/family/count | Count familial boosts
[**boost_create_boost**](BoostsApi.md#boost_create_boost) | **POST** /boost/create | Creates a boost
[**boost_create_child_boost**](BoostsApi.md#boost_create_child_boost) | **POST** /boost/create/child | Creates a boost
[**boost_delete_boost**](BoostsApi.md#boost_delete_boost) | **DELETE** /boost | Delete a boost
[**boost_generate_claim_link**](BoostsApi.md#boost_generate_claim_link) | **POST** /boost/generate-claim-link | Generate a claim link for a boost
[**boost_get_boost**](BoostsApi.md#boost_get_boost) | **GET** /boost | Get boost
[**boost_get_boost_admins**](BoostsApi.md#boost_get_boost_admins) | **POST** /boost/admins | Get boost admins
[**boost_get_boost_children**](BoostsApi.md#boost_get_boost_children) | **POST** /boost/children | Get boost children
[**boost_get_boost_parents**](BoostsApi.md#boost_get_boost_parents) | **POST** /boost/parents | Get boost parents
[**boost_get_boost_permissions**](BoostsApi.md#boost_get_boost_permissions) | **GET** /boost/permissions | Get boost permissions
[**boost_get_boost_recipient_count**](BoostsApi.md#boost_get_boost_recipient_count) | **GET** /boost/recipients/count | Get boost recipients count
[**boost_get_boost_recipients**](BoostsApi.md#boost_get_boost_recipients) | **GET** /boost/recipients | Get boost recipients
[**boost_get_boost_siblings**](BoostsApi.md#boost_get_boost_siblings) | **POST** /boost/siblings | Get boost siblings
[**boost_get_boosts**](BoostsApi.md#boost_get_boosts) | **POST** /boost/all | Get boosts
[**boost_get_children_profile_managers**](BoostsApi.md#boost_get_children_profile_managers) | **POST** /boost/children-profile-managers | Get Profile Managers that are a child of a boost
[**boost_get_familial_boosts**](BoostsApi.md#boost_get_familial_boosts) | **POST** /boost/family | Get familial boosts
[**boost_get_other_boost_permissions**](BoostsApi.md#boost_get_other_boost_permissions) | **GET** /boost/permissions/{profileId} | Get boost permissions for someone else
[**boost_get_paginated_boost_recipients**](BoostsApi.md#boost_get_paginated_boost_recipients) | **POST** /boost/recipients/paginated | Get boost recipients
[**boost_get_paginated_boosts**](BoostsApi.md#boost_get_paginated_boosts) | **POST** /boost/paginated | Get boosts
[**boost_make_boost_parent**](BoostsApi.md#boost_make_boost_parent) | **POST** /boost/make-parent | Make Boost Parent
[**boost_remove_boost_admin**](BoostsApi.md#boost_remove_boost_admin) | **POST** /boost/remove-admin | Remove a Boost admin
[**boost_remove_boost_parent**](BoostsApi.md#boost_remove_boost_parent) | **POST** /boost/remove-parent | Remove Boost Parent
[**boost_send_boost**](BoostsApi.md#boost_send_boost) | **POST** /boost/send/{profileId} | Send a Boost
[**boost_send_boost_via_signing_authority**](BoostsApi.md#boost_send_boost_via_signing_authority) | **POST** /boost/send/via-signing-authority/{profileId} | Send a boost to a profile using a signing authority
[**boost_update_boost**](BoostsApi.md#boost_update_boost) | **POST** /boost | Update a boost
[**boost_update_boost_permissions**](BoostsApi.md#boost_update_boost_permissions) | **POST** /boost/permissions | Update boost permissions
[**boost_update_other_boost_permissions**](BoostsApi.md#boost_update_other_boost_permissions) | **POST** /boost/permissions/{profileId} | Update other profile&#39;s boost permissions


# **boost_add_boost_admin**
> bool boost_add_boost_admin(boost_add_boost_admin_request)

Add a Boost admin

This route adds a new admin for a boost

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_add_boost_admin_request import BoostAddBoostAdminRequest
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_add_boost_admin_request = openapi_client.BoostAddBoostAdminRequest() # BoostAddBoostAdminRequest | 

    try:
        # Add a Boost admin
        api_response = api_instance.boost_add_boost_admin(boost_add_boost_admin_request)
        print("The response of BoostsApi->boost_add_boost_admin:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_add_boost_admin: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_add_boost_admin_request** | [**BoostAddBoostAdminRequest**](BoostAddBoostAdminRequest.md)|  | 

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

# **boost_claim_boost_with_link**
> str boost_claim_boost_with_link(boost_generate_claim_link200_response)

Claim a boost using a claim link

Claims a boost using a claim link, including a challenge

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_generate_claim_link200_response import BoostGenerateClaimLink200Response
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_generate_claim_link200_response = openapi_client.BoostGenerateClaimLink200Response() # BoostGenerateClaimLink200Response | 

    try:
        # Claim a boost using a claim link
        api_response = api_instance.boost_claim_boost_with_link(boost_generate_claim_link200_response)
        print("The response of BoostsApi->boost_claim_boost_with_link:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_claim_boost_with_link: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_generate_claim_link200_response** | [**BoostGenerateClaimLink200Response**](BoostGenerateClaimLink200Response.md)|  | 

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

# **boost_count_boost_children**
> float boost_count_boost_children(boost_count_boost_children_request)

Count boost children

This endpoint counts the children of a particular boost

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_count_boost_children_request import BoostCountBoostChildrenRequest
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_count_boost_children_request = openapi_client.BoostCountBoostChildrenRequest() # BoostCountBoostChildrenRequest | 

    try:
        # Count boost children
        api_response = api_instance.boost_count_boost_children(boost_count_boost_children_request)
        print("The response of BoostsApi->boost_count_boost_children:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_count_boost_children: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_count_boost_children_request** | [**BoostCountBoostChildrenRequest**](BoostCountBoostChildrenRequest.md)|  | 

### Return type

**float**

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

# **boost_count_boost_parents**
> float boost_count_boost_parents(boost_count_boost_children_request)

Count boost parents

This endpoint counts the parents of a particular boost

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_count_boost_children_request import BoostCountBoostChildrenRequest
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_count_boost_children_request = openapi_client.BoostCountBoostChildrenRequest() # BoostCountBoostChildrenRequest | 

    try:
        # Count boost parents
        api_response = api_instance.boost_count_boost_parents(boost_count_boost_children_request)
        print("The response of BoostsApi->boost_count_boost_parents:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_count_boost_parents: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_count_boost_children_request** | [**BoostCountBoostChildrenRequest**](BoostCountBoostChildrenRequest.md)|  | 

### Return type

**float**

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

# **boost_count_boost_siblings**
> float boost_count_boost_siblings(boost_count_boost_siblings_request)

Count boost siblings

This endpoint counts the siblings of a particular boost

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_count_boost_siblings_request import BoostCountBoostSiblingsRequest
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_count_boost_siblings_request = openapi_client.BoostCountBoostSiblingsRequest() # BoostCountBoostSiblingsRequest | 

    try:
        # Count boost siblings
        api_response = api_instance.boost_count_boost_siblings(boost_count_boost_siblings_request)
        print("The response of BoostsApi->boost_count_boost_siblings:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_count_boost_siblings: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_count_boost_siblings_request** | [**BoostCountBoostSiblingsRequest**](BoostCountBoostSiblingsRequest.md)|  | 

### Return type

**float**

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

# **boost_count_boosts**
> float boost_count_boosts(boost_get_boosts_request=boost_get_boosts_request)

Count managed boosts

This endpoint counts the current user's managed boosts.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boosts_request import BoostGetBoostsRequest
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_get_boosts_request = openapi_client.BoostGetBoostsRequest() # BoostGetBoostsRequest |  (optional)

    try:
        # Count managed boosts
        api_response = api_instance.boost_count_boosts(boost_get_boosts_request=boost_get_boosts_request)
        print("The response of BoostsApi->boost_count_boosts:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_count_boosts: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_get_boosts_request** | [**BoostGetBoostsRequest**](BoostGetBoostsRequest.md)|  | [optional] 

### Return type

**float**

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

# **boost_count_familial_boosts**
> float boost_count_familial_boosts(boost_count_familial_boosts_request)

Count familial boosts

This endpoint counts the parents, children, and siblings of a particular boost

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_count_familial_boosts_request import BoostCountFamilialBoostsRequest
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_count_familial_boosts_request = openapi_client.BoostCountFamilialBoostsRequest() # BoostCountFamilialBoostsRequest | 

    try:
        # Count familial boosts
        api_response = api_instance.boost_count_familial_boosts(boost_count_familial_boosts_request)
        print("The response of BoostsApi->boost_count_familial_boosts:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_count_familial_boosts: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_count_familial_boosts_request** | [**BoostCountFamilialBoostsRequest**](BoostCountFamilialBoostsRequest.md)|  | 

### Return type

**float**

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

# **boost_create_boost**
> str boost_create_boost(boost_create_boost_request)

Creates a boost

This route creates a boost

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_create_boost_request import BoostCreateBoostRequest
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_create_boost_request = openapi_client.BoostCreateBoostRequest() # BoostCreateBoostRequest | 

    try:
        # Creates a boost
        api_response = api_instance.boost_create_boost(boost_create_boost_request)
        print("The response of BoostsApi->boost_create_boost:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_create_boost: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_create_boost_request** | [**BoostCreateBoostRequest**](BoostCreateBoostRequest.md)|  | 

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

# **boost_create_child_boost**
> str boost_create_child_boost(boost_create_child_boost_request)

Creates a boost

This route creates a boost

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_create_child_boost_request import BoostCreateChildBoostRequest
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_create_child_boost_request = openapi_client.BoostCreateChildBoostRequest() # BoostCreateChildBoostRequest | 

    try:
        # Creates a boost
        api_response = api_instance.boost_create_child_boost(boost_create_child_boost_request)
        print("The response of BoostsApi->boost_create_child_boost:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_create_child_boost: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_create_child_boost_request** | [**BoostCreateChildBoostRequest**](BoostCreateChildBoostRequest.md)|  | 

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

# **boost_delete_boost**
> bool boost_delete_boost(uri)

Delete a boost

This route deletes a boost

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
    api_instance = openapi_client.BoostsApi(api_client)
    uri = 'uri_example' # str | 

    try:
        # Delete a boost
        api_response = api_instance.boost_delete_boost(uri)
        print("The response of BoostsApi->boost_delete_boost:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_delete_boost: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **uri** | **str**|  | 

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

# **boost_generate_claim_link**
> BoostGenerateClaimLink200Response boost_generate_claim_link(boost_generate_claim_link_request)

Generate a claim link for a boost

This route creates a challenge that an unknown profile can use to claim a boost.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_generate_claim_link200_response import BoostGenerateClaimLink200Response
from openapi_client.models.boost_generate_claim_link_request import BoostGenerateClaimLinkRequest
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_generate_claim_link_request = openapi_client.BoostGenerateClaimLinkRequest() # BoostGenerateClaimLinkRequest | 

    try:
        # Generate a claim link for a boost
        api_response = api_instance.boost_generate_claim_link(boost_generate_claim_link_request)
        print("The response of BoostsApi->boost_generate_claim_link:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_generate_claim_link: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_generate_claim_link_request** | [**BoostGenerateClaimLinkRequest**](BoostGenerateClaimLinkRequest.md)|  | 

### Return type

[**BoostGenerateClaimLink200Response**](BoostGenerateClaimLink200Response.md)

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

# **boost_get_boost**
> BoostGetBoost200Response boost_get_boost(uri)

Get boost

This endpoint gets metadata about a boost

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost200_response import BoostGetBoost200Response
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
    api_instance = openapi_client.BoostsApi(api_client)
    uri = 'uri_example' # str | 

    try:
        # Get boost
        api_response = api_instance.boost_get_boost(uri)
        print("The response of BoostsApi->boost_get_boost:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_get_boost: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **uri** | **str**|  | 

### Return type

[**BoostGetBoost200Response**](BoostGetBoost200Response.md)

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

# **boost_get_boost_admins**
> BoostGetBoostAdmins200Response boost_get_boost_admins(boost_get_boost_admins_request)

Get boost admins

This route returns the admins for a boost

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost_admins200_response import BoostGetBoostAdmins200Response
from openapi_client.models.boost_get_boost_admins_request import BoostGetBoostAdminsRequest
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_get_boost_admins_request = openapi_client.BoostGetBoostAdminsRequest() # BoostGetBoostAdminsRequest | 

    try:
        # Get boost admins
        api_response = api_instance.boost_get_boost_admins(boost_get_boost_admins_request)
        print("The response of BoostsApi->boost_get_boost_admins:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_get_boost_admins: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_get_boost_admins_request** | [**BoostGetBoostAdminsRequest**](BoostGetBoostAdminsRequest.md)|  | 

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
**0** | Error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **boost_get_boost_children**
> BoostGetPaginatedBoosts200Response boost_get_boost_children(boost_get_boost_children_request)

Get boost children

This endpoint gets the children of a particular boost

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost_children_request import BoostGetBoostChildrenRequest
from openapi_client.models.boost_get_paginated_boosts200_response import BoostGetPaginatedBoosts200Response
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_get_boost_children_request = openapi_client.BoostGetBoostChildrenRequest() # BoostGetBoostChildrenRequest | 

    try:
        # Get boost children
        api_response = api_instance.boost_get_boost_children(boost_get_boost_children_request)
        print("The response of BoostsApi->boost_get_boost_children:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_get_boost_children: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_get_boost_children_request** | [**BoostGetBoostChildrenRequest**](BoostGetBoostChildrenRequest.md)|  | 

### Return type

[**BoostGetPaginatedBoosts200Response**](BoostGetPaginatedBoosts200Response.md)

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

# **boost_get_boost_parents**
> BoostGetPaginatedBoosts200Response boost_get_boost_parents(boost_get_boost_children_request)

Get boost parents

This endpoint gets the parents of a particular boost

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost_children_request import BoostGetBoostChildrenRequest
from openapi_client.models.boost_get_paginated_boosts200_response import BoostGetPaginatedBoosts200Response
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_get_boost_children_request = openapi_client.BoostGetBoostChildrenRequest() # BoostGetBoostChildrenRequest | 

    try:
        # Get boost parents
        api_response = api_instance.boost_get_boost_parents(boost_get_boost_children_request)
        print("The response of BoostsApi->boost_get_boost_parents:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_get_boost_parents: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_get_boost_children_request** | [**BoostGetBoostChildrenRequest**](BoostGetBoostChildrenRequest.md)|  | 

### Return type

[**BoostGetPaginatedBoosts200Response**](BoostGetPaginatedBoosts200Response.md)

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

# **boost_get_boost_permissions**
> BoostGetBoost200ResponseClaimPermissions boost_get_boost_permissions(uri)

Get boost permissions

This endpoint gets permission metadata about a boost

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost200_response_claim_permissions import BoostGetBoost200ResponseClaimPermissions
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
    api_instance = openapi_client.BoostsApi(api_client)
    uri = 'uri_example' # str | 

    try:
        # Get boost permissions
        api_response = api_instance.boost_get_boost_permissions(uri)
        print("The response of BoostsApi->boost_get_boost_permissions:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_get_boost_permissions: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **uri** | **str**|  | 

### Return type

[**BoostGetBoost200ResponseClaimPermissions**](BoostGetBoost200ResponseClaimPermissions.md)

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

# **boost_get_boost_recipient_count**
> float boost_get_boost_recipient_count(uri, include_unaccepted_boosts=include_unaccepted_boosts)

Get boost recipients count

This endpoint counts the recipients of a particular boost

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
    api_instance = openapi_client.BoostsApi(api_client)
    uri = 'uri_example' # str | 
    include_unaccepted_boosts = True # bool |  (optional) (default to True)

    try:
        # Get boost recipients count
        api_response = api_instance.boost_get_boost_recipient_count(uri, include_unaccepted_boosts=include_unaccepted_boosts)
        print("The response of BoostsApi->boost_get_boost_recipient_count:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_get_boost_recipient_count: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **uri** | **str**|  | 
 **include_unaccepted_boosts** | **bool**|  | [optional] [default to True]

### Return type

**float**

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

# **boost_get_boost_recipients**
> List[BoostGetBoostRecipients200ResponseInner] boost_get_boost_recipients(uri, limit=limit, skip=skip, include_unaccepted_boosts=include_unaccepted_boosts)

Get boost recipients

This endpoint gets the recipients of a particular boost.
Warning! This route is deprecated and currently has a hard limit of returning only the first 50 boosts. Please use getPaginatedBoostRecipients instead

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost_recipients200_response_inner import BoostGetBoostRecipients200ResponseInner
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
    api_instance = openapi_client.BoostsApi(api_client)
    uri = 'uri_example' # str | 
    limit = 3.4 # float |  (optional)
    skip = 3.4 # float |  (optional)
    include_unaccepted_boosts = True # bool |  (optional) (default to True)

    try:
        # Get boost recipients
        api_response = api_instance.boost_get_boost_recipients(uri, limit=limit, skip=skip, include_unaccepted_boosts=include_unaccepted_boosts)
        print("The response of BoostsApi->boost_get_boost_recipients:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_get_boost_recipients: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **uri** | **str**|  | 
 **limit** | **float**|  | [optional] 
 **skip** | **float**|  | [optional] 
 **include_unaccepted_boosts** | **bool**|  | [optional] [default to True]

### Return type

[**List[BoostGetBoostRecipients200ResponseInner]**](BoostGetBoostRecipients200ResponseInner.md)

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

# **boost_get_boost_siblings**
> BoostGetPaginatedBoosts200Response boost_get_boost_siblings(boost_get_boost_siblings_request)

Get boost siblings

This endpoint gets the siblings of a particular boost

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost_siblings_request import BoostGetBoostSiblingsRequest
from openapi_client.models.boost_get_paginated_boosts200_response import BoostGetPaginatedBoosts200Response
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_get_boost_siblings_request = openapi_client.BoostGetBoostSiblingsRequest() # BoostGetBoostSiblingsRequest | 

    try:
        # Get boost siblings
        api_response = api_instance.boost_get_boost_siblings(boost_get_boost_siblings_request)
        print("The response of BoostsApi->boost_get_boost_siblings:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_get_boost_siblings: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_get_boost_siblings_request** | [**BoostGetBoostSiblingsRequest**](BoostGetBoostSiblingsRequest.md)|  | 

### Return type

[**BoostGetPaginatedBoosts200Response**](BoostGetPaginatedBoosts200Response.md)

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

# **boost_get_boosts**
> List[BoostGetBoosts200ResponseInner] boost_get_boosts(boost_get_boosts_request=boost_get_boosts_request)

Get boosts

This endpoint gets the current user's boosts.
Warning! This route is deprecated and currently has a hard limit of returning only the first 50 boosts. Please use getPaginatedBoosts instead

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boosts200_response_inner import BoostGetBoosts200ResponseInner
from openapi_client.models.boost_get_boosts_request import BoostGetBoostsRequest
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_get_boosts_request = openapi_client.BoostGetBoostsRequest() # BoostGetBoostsRequest |  (optional)

    try:
        # Get boosts
        api_response = api_instance.boost_get_boosts(boost_get_boosts_request=boost_get_boosts_request)
        print("The response of BoostsApi->boost_get_boosts:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_get_boosts: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_get_boosts_request** | [**BoostGetBoostsRequest**](BoostGetBoostsRequest.md)|  | [optional] 

### Return type

[**List[BoostGetBoosts200ResponseInner]**](BoostGetBoosts200ResponseInner.md)

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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_get_children_profile_managers_request = openapi_client.BoostGetChildrenProfileManagersRequest() # BoostGetChildrenProfileManagersRequest | 

    try:
        # Get Profile Managers that are a child of a boost
        api_response = api_instance.boost_get_children_profile_managers(boost_get_children_profile_managers_request)
        print("The response of BoostsApi->boost_get_children_profile_managers:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_get_children_profile_managers: %s\n" % e)
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
**0** | Error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **boost_get_familial_boosts**
> BoostGetPaginatedBoosts200Response boost_get_familial_boosts(boost_get_familial_boosts_request)

Get familial boosts

This endpoint gets the parents, children, and siblings of a particular boost

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_familial_boosts_request import BoostGetFamilialBoostsRequest
from openapi_client.models.boost_get_paginated_boosts200_response import BoostGetPaginatedBoosts200Response
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_get_familial_boosts_request = openapi_client.BoostGetFamilialBoostsRequest() # BoostGetFamilialBoostsRequest | 

    try:
        # Get familial boosts
        api_response = api_instance.boost_get_familial_boosts(boost_get_familial_boosts_request)
        print("The response of BoostsApi->boost_get_familial_boosts:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_get_familial_boosts: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_get_familial_boosts_request** | [**BoostGetFamilialBoostsRequest**](BoostGetFamilialBoostsRequest.md)|  | 

### Return type

[**BoostGetPaginatedBoosts200Response**](BoostGetPaginatedBoosts200Response.md)

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

# **boost_get_other_boost_permissions**
> BoostGetBoost200ResponseClaimPermissions boost_get_other_boost_permissions(uri, profile_id)

Get boost permissions for someone else

This endpoint gets permission metadata about a boost for someone else

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost200_response_claim_permissions import BoostGetBoost200ResponseClaimPermissions
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
    api_instance = openapi_client.BoostsApi(api_client)
    uri = 'uri_example' # str | 
    profile_id = 'profile_id_example' # str | 

    try:
        # Get boost permissions for someone else
        api_response = api_instance.boost_get_other_boost_permissions(uri, profile_id)
        print("The response of BoostsApi->boost_get_other_boost_permissions:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_get_other_boost_permissions: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **uri** | **str**|  | 
 **profile_id** | **str**|  | 

### Return type

[**BoostGetBoost200ResponseClaimPermissions**](BoostGetBoost200ResponseClaimPermissions.md)

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

# **boost_get_paginated_boost_recipients**
> BoostGetPaginatedBoostRecipients200Response boost_get_paginated_boost_recipients(boost_get_paginated_boost_recipients_request)

Get boost recipients

This endpoint gets the recipients of a particular boost

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_paginated_boost_recipients200_response import BoostGetPaginatedBoostRecipients200Response
from openapi_client.models.boost_get_paginated_boost_recipients_request import BoostGetPaginatedBoostRecipientsRequest
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_get_paginated_boost_recipients_request = openapi_client.BoostGetPaginatedBoostRecipientsRequest() # BoostGetPaginatedBoostRecipientsRequest | 

    try:
        # Get boost recipients
        api_response = api_instance.boost_get_paginated_boost_recipients(boost_get_paginated_boost_recipients_request)
        print("The response of BoostsApi->boost_get_paginated_boost_recipients:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_get_paginated_boost_recipients: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_get_paginated_boost_recipients_request** | [**BoostGetPaginatedBoostRecipientsRequest**](BoostGetPaginatedBoostRecipientsRequest.md)|  | 

### Return type

[**BoostGetPaginatedBoostRecipients200Response**](BoostGetPaginatedBoostRecipients200Response.md)

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

# **boost_get_paginated_boosts**
> BoostGetPaginatedBoosts200Response boost_get_paginated_boosts(boost_get_paginated_boosts_request=boost_get_paginated_boosts_request)

Get boosts

This endpoint gets the current user's boosts

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_paginated_boosts200_response import BoostGetPaginatedBoosts200Response
from openapi_client.models.boost_get_paginated_boosts_request import BoostGetPaginatedBoostsRequest
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_get_paginated_boosts_request = openapi_client.BoostGetPaginatedBoostsRequest() # BoostGetPaginatedBoostsRequest |  (optional)

    try:
        # Get boosts
        api_response = api_instance.boost_get_paginated_boosts(boost_get_paginated_boosts_request=boost_get_paginated_boosts_request)
        print("The response of BoostsApi->boost_get_paginated_boosts:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_get_paginated_boosts: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_get_paginated_boosts_request** | [**BoostGetPaginatedBoostsRequest**](BoostGetPaginatedBoostsRequest.md)|  | [optional] 

### Return type

[**BoostGetPaginatedBoosts200Response**](BoostGetPaginatedBoosts200Response.md)

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

# **boost_make_boost_parent**
> bool boost_make_boost_parent(boost_make_boost_parent_request)

Make Boost Parent

This endpoint creates a parent/child relationship between two boosts

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_make_boost_parent_request import BoostMakeBoostParentRequest
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_make_boost_parent_request = openapi_client.BoostMakeBoostParentRequest() # BoostMakeBoostParentRequest | 

    try:
        # Make Boost Parent
        api_response = api_instance.boost_make_boost_parent(boost_make_boost_parent_request)
        print("The response of BoostsApi->boost_make_boost_parent:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_make_boost_parent: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_make_boost_parent_request** | [**BoostMakeBoostParentRequest**](BoostMakeBoostParentRequest.md)|  | 

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

# **boost_remove_boost_admin**
> bool boost_remove_boost_admin(boost_add_boost_admin_request)

Remove a Boost admin

This route removes an  admin from a boost

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_add_boost_admin_request import BoostAddBoostAdminRequest
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_add_boost_admin_request = openapi_client.BoostAddBoostAdminRequest() # BoostAddBoostAdminRequest | 

    try:
        # Remove a Boost admin
        api_response = api_instance.boost_remove_boost_admin(boost_add_boost_admin_request)
        print("The response of BoostsApi->boost_remove_boost_admin:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_remove_boost_admin: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_add_boost_admin_request** | [**BoostAddBoostAdminRequest**](BoostAddBoostAdminRequest.md)|  | 

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

# **boost_remove_boost_parent**
> bool boost_remove_boost_parent(boost_make_boost_parent_request)

Remove Boost Parent

This endpoint removes a parent/child relationship between two boosts

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_make_boost_parent_request import BoostMakeBoostParentRequest
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_make_boost_parent_request = openapi_client.BoostMakeBoostParentRequest() # BoostMakeBoostParentRequest | 

    try:
        # Remove Boost Parent
        api_response = api_instance.boost_remove_boost_parent(boost_make_boost_parent_request)
        print("The response of BoostsApi->boost_remove_boost_parent:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_remove_boost_parent: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_make_boost_parent_request** | [**BoostMakeBoostParentRequest**](BoostMakeBoostParentRequest.md)|  | 

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

# **boost_send_boost**
> str boost_send_boost(profile_id, boost_send_boost_request)

Send a Boost

This endpoint sends a boost to a profile

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_send_boost_request import BoostSendBoostRequest
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
    api_instance = openapi_client.BoostsApi(api_client)
    profile_id = 'profile_id_example' # str | 
    boost_send_boost_request = openapi_client.BoostSendBoostRequest() # BoostSendBoostRequest | 

    try:
        # Send a Boost
        api_response = api_instance.boost_send_boost(profile_id, boost_send_boost_request)
        print("The response of BoostsApi->boost_send_boost:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_send_boost: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_id** | **str**|  | 
 **boost_send_boost_request** | [**BoostSendBoostRequest**](BoostSendBoostRequest.md)|  | 

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

# **boost_send_boost_via_signing_authority**
> str boost_send_boost_via_signing_authority(profile_id, boost_send_boost_via_signing_authority_request)

Send a boost to a profile using a signing authority

Issues a boost VC to a recipient profile using a specified signing authority and sends it via the network.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_send_boost_via_signing_authority_request import BoostSendBoostViaSigningAuthorityRequest
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
    api_instance = openapi_client.BoostsApi(api_client)
    profile_id = 'profile_id_example' # str | 
    boost_send_boost_via_signing_authority_request = openapi_client.BoostSendBoostViaSigningAuthorityRequest() # BoostSendBoostViaSigningAuthorityRequest | 

    try:
        # Send a boost to a profile using a signing authority
        api_response = api_instance.boost_send_boost_via_signing_authority(profile_id, boost_send_boost_via_signing_authority_request)
        print("The response of BoostsApi->boost_send_boost_via_signing_authority:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_send_boost_via_signing_authority: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_id** | **str**|  | 
 **boost_send_boost_via_signing_authority_request** | [**BoostSendBoostViaSigningAuthorityRequest**](BoostSendBoostViaSigningAuthorityRequest.md)|  | 

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

# **boost_update_boost**
> bool boost_update_boost(boost_update_boost_request)

Update a boost

This route updates a boost

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_update_boost_request import BoostUpdateBoostRequest
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_update_boost_request = openapi_client.BoostUpdateBoostRequest() # BoostUpdateBoostRequest | 

    try:
        # Update a boost
        api_response = api_instance.boost_update_boost(boost_update_boost_request)
        print("The response of BoostsApi->boost_update_boost:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_update_boost: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_update_boost_request** | [**BoostUpdateBoostRequest**](BoostUpdateBoostRequest.md)|  | 

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

# **boost_update_boost_permissions**
> bool boost_update_boost_permissions(boost_update_boost_permissions_request)

Update boost permissions

This endpoint updates permission metadata about a boost for the current user

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_update_boost_permissions_request import BoostUpdateBoostPermissionsRequest
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
    api_instance = openapi_client.BoostsApi(api_client)
    boost_update_boost_permissions_request = openapi_client.BoostUpdateBoostPermissionsRequest() # BoostUpdateBoostPermissionsRequest | 

    try:
        # Update boost permissions
        api_response = api_instance.boost_update_boost_permissions(boost_update_boost_permissions_request)
        print("The response of BoostsApi->boost_update_boost_permissions:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_update_boost_permissions: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_update_boost_permissions_request** | [**BoostUpdateBoostPermissionsRequest**](BoostUpdateBoostPermissionsRequest.md)|  | 

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

# **boost_update_other_boost_permissions**
> bool boost_update_other_boost_permissions(profile_id, boost_update_boost_permissions_request)

Update other profile's boost permissions

This endpoint updates permission metadata about a boost for another user

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_update_boost_permissions_request import BoostUpdateBoostPermissionsRequest
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
    api_instance = openapi_client.BoostsApi(api_client)
    profile_id = 'profile_id_example' # str | 
    boost_update_boost_permissions_request = openapi_client.BoostUpdateBoostPermissionsRequest() # BoostUpdateBoostPermissionsRequest | 

    try:
        # Update other profile's boost permissions
        api_response = api_instance.boost_update_other_boost_permissions(profile_id, boost_update_boost_permissions_request)
        print("The response of BoostsApi->boost_update_other_boost_permissions:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling BoostsApi->boost_update_other_boost_permissions: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_id** | **str**|  | 
 **boost_update_boost_permissions_request** | [**BoostUpdateBoostPermissionsRequest**](BoostUpdateBoostPermissionsRequest.md)|  | 

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

