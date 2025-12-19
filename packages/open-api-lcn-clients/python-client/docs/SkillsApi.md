# openapi_client.SkillsApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**skill_frameworks_add_framework_admin**](SkillsApi.md#skill_frameworks_add_framework_admin) | **POST** /skills/frameworks/{frameworkId}/admins | Add framework admin
[**skill_frameworks_count_boosts_that_use_framework**](SkillsApi.md#skill_frameworks_count_boosts_that_use_framework) | **POST** /skills/frameworks/{id}/boosts/count | Count boosts that use a framework
[**skill_frameworks_create**](SkillsApi.md#skill_frameworks_create) | **POST** /skills/frameworks | Link Skill Framework
[**skill_frameworks_create_managed**](SkillsApi.md#skill_frameworks_create_managed) | **POST** /skills/frameworks/custom | Create and manage a custom skill framework
[**skill_frameworks_create_managed_batch**](SkillsApi.md#skill_frameworks_create_managed_batch) | **POST** /skills/frameworks/custom/batch | Create multiple custom skill frameworks
[**skill_frameworks_delete**](SkillsApi.md#skill_frameworks_delete) | **DELETE** /skills/frameworks/{id} | Delete a managed skill framework
[**skill_frameworks_get_boosts_that_use_framework**](SkillsApi.md#skill_frameworks_get_boosts_that_use_framework) | **POST** /skills/frameworks/{id}/boosts | Get boosts that use a framework
[**skill_frameworks_get_by_id**](SkillsApi.md#skill_frameworks_get_by_id) | **GET** /skills/frameworks/{id} | Get Skill Framework with skills
[**skill_frameworks_list_framework_admins**](SkillsApi.md#skill_frameworks_list_framework_admins) | **GET** /skills/frameworks/{frameworkId}/admins | List framework admins
[**skill_frameworks_list_mine**](SkillsApi.md#skill_frameworks_list_mine) | **GET** /skills/frameworks | List Skill Frameworks I manage
[**skill_frameworks_remove_framework_admin**](SkillsApi.md#skill_frameworks_remove_framework_admin) | **DELETE** /skills/frameworks/{frameworkId}/admins/{profileId} | Remove framework admin
[**skill_frameworks_replace_skills**](SkillsApi.md#skill_frameworks_replace_skills) | **POST** /skills/frameworks/{frameworkId}/replace | Replace all skills in a framework
[**skill_frameworks_update**](SkillsApi.md#skill_frameworks_update) | **PATCH** /skills/frameworks/{id} | Update a managed skill framework
[**skills_add_skill_tag**](SkillsApi.md#skills_add_skill_tag) | **POST** /skills/{id}/tags | Add a tag to a skill
[**skills_count_skills**](SkillsApi.md#skills_count_skills) | **GET** /skills/frameworks/{frameworkId}/count | Count skills in a framework
[**skills_create**](SkillsApi.md#skills_create) | **POST** /skills | Create a skill
[**skills_create_many**](SkillsApi.md#skills_create_many) | **POST** /skills/batch | Create many skills
[**skills_delete**](SkillsApi.md#skills_delete) | **DELETE** /skills/{id} | Delete a skill
[**skills_get_framework_skill_tree**](SkillsApi.md#skills_get_framework_skill_tree) | **GET** /skills/frameworks/{id}/tree | Get framework skill tree (roots + first children)
[**skills_get_full_skill_tree**](SkillsApi.md#skills_get_full_skill_tree) | **GET** /skills/frameworks/{frameworkId}/tree/full | Get complete skill tree for a framework
[**skills_get_skill**](SkillsApi.md#skills_get_skill) | **GET** /skills/{id} | Get a skill by ID
[**skills_get_skill_children_tree**](SkillsApi.md#skills_get_skill_children_tree) | **GET** /skills/{id}/children | Get children for a skill (framework-scoped, paginated)
[**skills_get_skill_path**](SkillsApi.md#skills_get_skill_path) | **GET** /skills/{skillId}/path | Get breadcrumb path for a skill
[**skills_list_skill_tags**](SkillsApi.md#skills_list_skill_tags) | **GET** /skills/{id}/tags | List tags for a skill
[**skills_remove_skill_tag**](SkillsApi.md#skills_remove_skill_tag) | **DELETE** /skills/{id}/tags/{slug} | Remove a tag from a skill
[**skills_search_framework_skills**](SkillsApi.md#skills_search_framework_skills) | **POST** /skills/framework/search | Search skills in a framework
[**skills_sync_framework_skills**](SkillsApi.md#skills_sync_framework_skills) | **POST** /skills/frameworks/{id}/sync | Sync Framework Skills
[**skills_update**](SkillsApi.md#skills_update) | **PATCH** /skills/{id} | Update a skill


# **skill_frameworks_add_framework_admin**
> SkillFrameworksAddFrameworkAdmin200Response skill_frameworks_add_framework_admin(framework_id, skill_frameworks_add_framework_admin_request)

Add framework admin

Adds another profile as a manager of the framework. Requires existing manager access.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.skill_frameworks_add_framework_admin200_response import SkillFrameworksAddFrameworkAdmin200Response
from openapi_client.models.skill_frameworks_add_framework_admin_request import SkillFrameworksAddFrameworkAdminRequest
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
    api_instance = openapi_client.SkillsApi(api_client)
    framework_id = 'framework_id_example' # str | 
    skill_frameworks_add_framework_admin_request = openapi_client.SkillFrameworksAddFrameworkAdminRequest() # SkillFrameworksAddFrameworkAdminRequest | 

    try:
        # Add framework admin
        api_response = api_instance.skill_frameworks_add_framework_admin(framework_id, skill_frameworks_add_framework_admin_request)
        print("The response of SkillsApi->skill_frameworks_add_framework_admin:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skill_frameworks_add_framework_admin: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **framework_id** | **str**|  | 
 **skill_frameworks_add_framework_admin_request** | [**SkillFrameworksAddFrameworkAdminRequest**](SkillFrameworksAddFrameworkAdminRequest.md)|  | 

### Return type

[**SkillFrameworksAddFrameworkAdmin200Response**](SkillFrameworksAddFrameworkAdmin200Response.md)

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

# **skill_frameworks_count_boosts_that_use_framework**
> SkillFrameworksCountBoostsThatUseFramework200Response skill_frameworks_count_boosts_that_use_framework(id, boost_get_boosts_request)

Count boosts that use a framework

Returns the total count of boosts that use this skill framework via USES_FRAMEWORK relationship. Supports filtering with $regex, $in, and $or operators.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boosts_request import BoostGetBoostsRequest
from openapi_client.models.skill_frameworks_count_boosts_that_use_framework200_response import SkillFrameworksCountBoostsThatUseFramework200Response
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
    api_instance = openapi_client.SkillsApi(api_client)
    id = 'id_example' # str | 
    boost_get_boosts_request = openapi_client.BoostGetBoostsRequest() # BoostGetBoostsRequest | 

    try:
        # Count boosts that use a framework
        api_response = api_instance.skill_frameworks_count_boosts_that_use_framework(id, boost_get_boosts_request)
        print("The response of SkillsApi->skill_frameworks_count_boosts_that_use_framework:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skill_frameworks_count_boosts_that_use_framework: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 
 **boost_get_boosts_request** | [**BoostGetBoostsRequest**](BoostGetBoostsRequest.md)|  | 

### Return type

[**SkillFrameworksCountBoostsThatUseFramework200Response**](SkillFrameworksCountBoostsThatUseFramework200Response.md)

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

# **skill_frameworks_create**
> BoostGetBoostFrameworks200ResponseRecordsInner skill_frameworks_create(skill_frameworks_create_request)

Link Skill Framework

Links an existing provider framework to the caller and mirrors minimal metadata locally

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost_frameworks200_response_records_inner import BoostGetBoostFrameworks200ResponseRecordsInner
from openapi_client.models.skill_frameworks_create_request import SkillFrameworksCreateRequest
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
    api_instance = openapi_client.SkillsApi(api_client)
    skill_frameworks_create_request = openapi_client.SkillFrameworksCreateRequest() # SkillFrameworksCreateRequest | 

    try:
        # Link Skill Framework
        api_response = api_instance.skill_frameworks_create(skill_frameworks_create_request)
        print("The response of SkillsApi->skill_frameworks_create:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skill_frameworks_create: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **skill_frameworks_create_request** | [**SkillFrameworksCreateRequest**](SkillFrameworksCreateRequest.md)|  | 

### Return type

[**BoostGetBoostFrameworks200ResponseRecordsInner**](BoostGetBoostFrameworks200ResponseRecordsInner.md)

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

# **skill_frameworks_create_managed**
> BoostGetBoostFrameworks200ResponseRecordsInner skill_frameworks_create_managed(skill_frameworks_create_managed_request)

Create and manage a custom skill framework

Creates a new skill framework directly in the LearnCard Network and assigns the caller as a manager.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost_frameworks200_response_records_inner import BoostGetBoostFrameworks200ResponseRecordsInner
from openapi_client.models.skill_frameworks_create_managed_request import SkillFrameworksCreateManagedRequest
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
    api_instance = openapi_client.SkillsApi(api_client)
    skill_frameworks_create_managed_request = openapi_client.SkillFrameworksCreateManagedRequest() # SkillFrameworksCreateManagedRequest | 

    try:
        # Create and manage a custom skill framework
        api_response = api_instance.skill_frameworks_create_managed(skill_frameworks_create_managed_request)
        print("The response of SkillsApi->skill_frameworks_create_managed:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skill_frameworks_create_managed: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **skill_frameworks_create_managed_request** | [**SkillFrameworksCreateManagedRequest**](SkillFrameworksCreateManagedRequest.md)|  | 

### Return type

[**BoostGetBoostFrameworks200ResponseRecordsInner**](BoostGetBoostFrameworks200ResponseRecordsInner.md)

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

# **skill_frameworks_create_managed_batch**
> List[BoostGetBoostFrameworks200ResponseRecordsInner] skill_frameworks_create_managed_batch(skill_frameworks_create_managed_batch_request)

Create multiple custom skill frameworks

Creates multiple custom frameworks (optionally with initial skills) and assigns the caller as their manager.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost_frameworks200_response_records_inner import BoostGetBoostFrameworks200ResponseRecordsInner
from openapi_client.models.skill_frameworks_create_managed_batch_request import SkillFrameworksCreateManagedBatchRequest
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
    api_instance = openapi_client.SkillsApi(api_client)
    skill_frameworks_create_managed_batch_request = openapi_client.SkillFrameworksCreateManagedBatchRequest() # SkillFrameworksCreateManagedBatchRequest | 

    try:
        # Create multiple custom skill frameworks
        api_response = api_instance.skill_frameworks_create_managed_batch(skill_frameworks_create_managed_batch_request)
        print("The response of SkillsApi->skill_frameworks_create_managed_batch:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skill_frameworks_create_managed_batch: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **skill_frameworks_create_managed_batch_request** | [**SkillFrameworksCreateManagedBatchRequest**](SkillFrameworksCreateManagedBatchRequest.md)|  | 

### Return type

[**List[BoostGetBoostFrameworks200ResponseRecordsInner]**](BoostGetBoostFrameworks200ResponseRecordsInner.md)

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

# **skill_frameworks_delete**
> SkillFrameworksRemoveFrameworkAdmin200Response skill_frameworks_delete(id)

Delete a managed skill framework

Deletes a framework and its associated skills. Only available to managers of the framework.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.skill_frameworks_remove_framework_admin200_response import SkillFrameworksRemoveFrameworkAdmin200Response
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
    api_instance = openapi_client.SkillsApi(api_client)
    id = 'id_example' # str | 

    try:
        # Delete a managed skill framework
        api_response = api_instance.skill_frameworks_delete(id)
        print("The response of SkillsApi->skill_frameworks_delete:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skill_frameworks_delete: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 

### Return type

[**SkillFrameworksRemoveFrameworkAdmin200Response**](SkillFrameworksRemoveFrameworkAdmin200Response.md)

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

# **skill_frameworks_get_boosts_that_use_framework**
> BoostGetPaginatedBoosts200Response skill_frameworks_get_boosts_that_use_framework(id, skill_frameworks_get_boosts_that_use_framework_request)

Get boosts that use a framework

Returns paginated list of boosts that use this skill framework via USES_FRAMEWORK relationship. Supports filtering with $regex, $in, and $or operators.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_paginated_boosts200_response import BoostGetPaginatedBoosts200Response
from openapi_client.models.skill_frameworks_get_boosts_that_use_framework_request import SkillFrameworksGetBoostsThatUseFrameworkRequest
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
    api_instance = openapi_client.SkillsApi(api_client)
    id = 'id_example' # str | 
    skill_frameworks_get_boosts_that_use_framework_request = openapi_client.SkillFrameworksGetBoostsThatUseFrameworkRequest() # SkillFrameworksGetBoostsThatUseFrameworkRequest | 

    try:
        # Get boosts that use a framework
        api_response = api_instance.skill_frameworks_get_boosts_that_use_framework(id, skill_frameworks_get_boosts_that_use_framework_request)
        print("The response of SkillsApi->skill_frameworks_get_boosts_that_use_framework:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skill_frameworks_get_boosts_that_use_framework: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 
 **skill_frameworks_get_boosts_that_use_framework_request** | [**SkillFrameworksGetBoostsThatUseFrameworkRequest**](SkillFrameworksGetBoostsThatUseFrameworkRequest.md)|  | 

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
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **skill_frameworks_get_by_id**
> SkillFrameworksGetById200Response skill_frameworks_get_by_id(id, limit=limit, children_limit=children_limit, cursor=cursor)

Get Skill Framework with skills

Returns a framework and its skills from the configured provider (hierarchical tree)

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.skill_frameworks_get_by_id200_response import SkillFrameworksGetById200Response
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
    api_instance = openapi_client.SkillsApi(api_client)
    id = 'id_example' # str | 
    limit = 50 # int |  (optional) (default to 50)
    children_limit = 25 # int |  (optional) (default to 25)
    cursor = 'cursor_example' # str |  (optional)

    try:
        # Get Skill Framework with skills
        api_response = api_instance.skill_frameworks_get_by_id(id, limit=limit, children_limit=children_limit, cursor=cursor)
        print("The response of SkillsApi->skill_frameworks_get_by_id:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skill_frameworks_get_by_id: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 
 **limit** | **int**|  | [optional] [default to 50]
 **children_limit** | **int**|  | [optional] [default to 25]
 **cursor** | **str**|  | [optional] 

### Return type

[**SkillFrameworksGetById200Response**](SkillFrameworksGetById200Response.md)

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

# **skill_frameworks_list_framework_admins**
> List[BoostGetPaginatedBoostRecipients200ResponseRecordsInnerTo] skill_frameworks_list_framework_admins(framework_id)

List framework admins

Returns the profiles that manage the given framework. Requires manager access.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_paginated_boost_recipients200_response_records_inner_to import BoostGetPaginatedBoostRecipients200ResponseRecordsInnerTo
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
    api_instance = openapi_client.SkillsApi(api_client)
    framework_id = 'framework_id_example' # str | 

    try:
        # List framework admins
        api_response = api_instance.skill_frameworks_list_framework_admins(framework_id)
        print("The response of SkillsApi->skill_frameworks_list_framework_admins:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skill_frameworks_list_framework_admins: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **framework_id** | **str**|  | 

### Return type

[**List[BoostGetPaginatedBoostRecipients200ResponseRecordsInnerTo]**](BoostGetPaginatedBoostRecipients200ResponseRecordsInnerTo.md)

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

# **skill_frameworks_list_mine**
> List[BoostGetBoostFrameworks200ResponseRecordsInner] skill_frameworks_list_mine()

List Skill Frameworks I manage

Lists frameworks directly managed by the caller

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost_frameworks200_response_records_inner import BoostGetBoostFrameworks200ResponseRecordsInner
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
    api_instance = openapi_client.SkillsApi(api_client)

    try:
        # List Skill Frameworks I manage
        api_response = api_instance.skill_frameworks_list_mine()
        print("The response of SkillsApi->skill_frameworks_list_mine:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skill_frameworks_list_mine: %s\n" % e)
```



### Parameters

This endpoint does not need any parameter.

### Return type

[**List[BoostGetBoostFrameworks200ResponseRecordsInner]**](BoostGetBoostFrameworks200ResponseRecordsInner.md)

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

# **skill_frameworks_remove_framework_admin**
> SkillFrameworksRemoveFrameworkAdmin200Response skill_frameworks_remove_framework_admin(framework_id, profile_id)

Remove framework admin

Removes a manager from the framework. Requires manager access and at least one manager must remain.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.skill_frameworks_remove_framework_admin200_response import SkillFrameworksRemoveFrameworkAdmin200Response
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
    api_instance = openapi_client.SkillsApi(api_client)
    framework_id = 'framework_id_example' # str | 
    profile_id = 'profile_id_example' # str | 

    try:
        # Remove framework admin
        api_response = api_instance.skill_frameworks_remove_framework_admin(framework_id, profile_id)
        print("The response of SkillsApi->skill_frameworks_remove_framework_admin:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skill_frameworks_remove_framework_admin: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **framework_id** | **str**|  | 
 **profile_id** | **str**|  | 

### Return type

[**SkillFrameworksRemoveFrameworkAdmin200Response**](SkillFrameworksRemoveFrameworkAdmin200Response.md)

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

# **skill_frameworks_replace_skills**
> SkillFrameworksReplaceSkills200Response skill_frameworks_replace_skills(framework_id, skill_frameworks_replace_skills_request)

Replace all skills in a framework

Replaces the entire skill tree of a framework. Skills with matching IDs are updated if changed, skills not in the input are deleted, and new skills are created. Returns statistics about changes made.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.skill_frameworks_replace_skills200_response import SkillFrameworksReplaceSkills200Response
from openapi_client.models.skill_frameworks_replace_skills_request import SkillFrameworksReplaceSkillsRequest
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
    api_instance = openapi_client.SkillsApi(api_client)
    framework_id = 'framework_id_example' # str | 
    skill_frameworks_replace_skills_request = openapi_client.SkillFrameworksReplaceSkillsRequest() # SkillFrameworksReplaceSkillsRequest | 

    try:
        # Replace all skills in a framework
        api_response = api_instance.skill_frameworks_replace_skills(framework_id, skill_frameworks_replace_skills_request)
        print("The response of SkillsApi->skill_frameworks_replace_skills:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skill_frameworks_replace_skills: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **framework_id** | **str**|  | 
 **skill_frameworks_replace_skills_request** | [**SkillFrameworksReplaceSkillsRequest**](SkillFrameworksReplaceSkillsRequest.md)|  | 

### Return type

[**SkillFrameworksReplaceSkills200Response**](SkillFrameworksReplaceSkills200Response.md)

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

# **skill_frameworks_update**
> BoostGetBoostFrameworks200ResponseRecordsInner skill_frameworks_update(id, skill_frameworks_update_request)

Update a managed skill framework

Updates metadata for a framework managed by the caller.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_get_boost_frameworks200_response_records_inner import BoostGetBoostFrameworks200ResponseRecordsInner
from openapi_client.models.skill_frameworks_update_request import SkillFrameworksUpdateRequest
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
    api_instance = openapi_client.SkillsApi(api_client)
    id = 'id_example' # str | 
    skill_frameworks_update_request = openapi_client.SkillFrameworksUpdateRequest() # SkillFrameworksUpdateRequest | 

    try:
        # Update a managed skill framework
        api_response = api_instance.skill_frameworks_update(id, skill_frameworks_update_request)
        print("The response of SkillsApi->skill_frameworks_update:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skill_frameworks_update: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 
 **skill_frameworks_update_request** | [**SkillFrameworksUpdateRequest**](SkillFrameworksUpdateRequest.md)|  | 

### Return type

[**BoostGetBoostFrameworks200ResponseRecordsInner**](BoostGetBoostFrameworks200ResponseRecordsInner.md)

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
**404** | Not found |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **skills_add_skill_tag**
> List[SkillsAddSkillTag200ResponseInner] skills_add_skill_tag(id, skills_add_skill_tag_request)

Add a tag to a skill

Creates the tag by slug if missing and attaches it to the skill. Requires managing a framework containing the skill.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.skills_add_skill_tag200_response_inner import SkillsAddSkillTag200ResponseInner
from openapi_client.models.skills_add_skill_tag_request import SkillsAddSkillTagRequest
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
    api_instance = openapi_client.SkillsApi(api_client)
    id = 'id_example' # str | 
    skills_add_skill_tag_request = openapi_client.SkillsAddSkillTagRequest() # SkillsAddSkillTagRequest | 

    try:
        # Add a tag to a skill
        api_response = api_instance.skills_add_skill_tag(id, skills_add_skill_tag_request)
        print("The response of SkillsApi->skills_add_skill_tag:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skills_add_skill_tag: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 
 **skills_add_skill_tag_request** | [**SkillsAddSkillTagRequest**](SkillsAddSkillTagRequest.md)|  | 

### Return type

[**List[SkillsAddSkillTag200ResponseInner]**](SkillsAddSkillTag200ResponseInner.md)

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

# **skills_count_skills**
> SkillsCountSkills200Response skills_count_skills(framework_id, skill_id=skill_id, recursive=recursive, only_count_competencies=only_count_competencies)

Count skills in a framework

Counts skills in a framework. If skillId is provided, counts children of that skill. If recursive is true, counts all descendants. Requires managing the framework.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.skills_count_skills200_response import SkillsCountSkills200Response
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
    api_instance = openapi_client.SkillsApi(api_client)
    framework_id = 'framework_id_example' # str | 
    skill_id = 'skill_id_example' # str |  (optional)
    recursive = False # bool |  (optional) (default to False)
    only_count_competencies = False # bool |  (optional) (default to False)

    try:
        # Count skills in a framework
        api_response = api_instance.skills_count_skills(framework_id, skill_id=skill_id, recursive=recursive, only_count_competencies=only_count_competencies)
        print("The response of SkillsApi->skills_count_skills:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skills_count_skills: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **framework_id** | **str**|  | 
 **skill_id** | **str**|  | [optional] 
 **recursive** | **bool**|  | [optional] [default to False]
 **only_count_competencies** | **bool**|  | [optional] [default to False]

### Return type

[**SkillsCountSkills200Response**](SkillsCountSkills200Response.md)

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

# **skills_create**
> SkillsCreate200Response skills_create(skills_create_request)

Create a skill

Creates a new skill within a framework managed by the caller.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.skills_create200_response import SkillsCreate200Response
from openapi_client.models.skills_create_request import SkillsCreateRequest
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
    api_instance = openapi_client.SkillsApi(api_client)
    skills_create_request = openapi_client.SkillsCreateRequest() # SkillsCreateRequest | 

    try:
        # Create a skill
        api_response = api_instance.skills_create(skills_create_request)
        print("The response of SkillsApi->skills_create:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skills_create: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **skills_create_request** | [**SkillsCreateRequest**](SkillsCreateRequest.md)|  | 

### Return type

[**SkillsCreate200Response**](SkillsCreate200Response.md)

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

# **skills_create_many**
> List[SkillsCreate200Response] skills_create_many(skills_create_many_request)

Create many skills

Creates multiple skills within a framework managed by the caller in a single request. Optionally specify parentId to add all root-level skills as children of an existing skill.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.skills_create200_response import SkillsCreate200Response
from openapi_client.models.skills_create_many_request import SkillsCreateManyRequest
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
    api_instance = openapi_client.SkillsApi(api_client)
    skills_create_many_request = openapi_client.SkillsCreateManyRequest() # SkillsCreateManyRequest | 

    try:
        # Create many skills
        api_response = api_instance.skills_create_many(skills_create_many_request)
        print("The response of SkillsApi->skills_create_many:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skills_create_many: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **skills_create_many_request** | [**SkillsCreateManyRequest**](SkillsCreateManyRequest.md)|  | 

### Return type

[**List[SkillsCreate200Response]**](SkillsCreate200Response.md)

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

# **skills_delete**
> SkillsDelete200Response skills_delete(id, framework_id, strategy=strategy)

Delete a skill

Deletes a skill from a framework managed by the caller. Strategy options: "reparent" (default) moves children to the deleted skill's parent (or makes them root nodes if no parent), "recursive" deletes the skill and all its descendants.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.skills_delete200_response import SkillsDelete200Response
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
    api_instance = openapi_client.SkillsApi(api_client)
    id = 'id_example' # str | 
    framework_id = 'framework_id_example' # str | 
    strategy = reparent # str |  (optional) (default to reparent)

    try:
        # Delete a skill
        api_response = api_instance.skills_delete(id, framework_id, strategy=strategy)
        print("The response of SkillsApi->skills_delete:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skills_delete: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 
 **framework_id** | **str**|  | 
 **strategy** | **str**|  | [optional] [default to reparent]

### Return type

[**SkillsDelete200Response**](SkillsDelete200Response.md)

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

# **skills_get_framework_skill_tree**
> SkillsGetFrameworkSkillTree200Response skills_get_framework_skill_tree(id, roots_limit=roots_limit, children_limit=children_limit, cursor=cursor)

Get framework skill tree (roots + first children)

Returns a paginated list of root skills for a framework and, for each root, the first page of its children. Use the per-node children endpoint to load more.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.skills_get_framework_skill_tree200_response import SkillsGetFrameworkSkillTree200Response
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
    api_instance = openapi_client.SkillsApi(api_client)
    id = 'id_example' # str | 
    roots_limit = 50 # int |  (optional) (default to 50)
    children_limit = 25 # int |  (optional) (default to 25)
    cursor = 'cursor_example' # str |  (optional)

    try:
        # Get framework skill tree (roots + first children)
        api_response = api_instance.skills_get_framework_skill_tree(id, roots_limit=roots_limit, children_limit=children_limit, cursor=cursor)
        print("The response of SkillsApi->skills_get_framework_skill_tree:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skills_get_framework_skill_tree: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 
 **roots_limit** | **int**|  | [optional] [default to 50]
 **children_limit** | **int**|  | [optional] [default to 25]
 **cursor** | **str**|  | [optional] 

### Return type

[**SkillsGetFrameworkSkillTree200Response**](SkillsGetFrameworkSkillTree200Response.md)

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

# **skills_get_full_skill_tree**
> SkillsGetFullSkillTree200Response skills_get_full_skill_tree(framework_id)

Get complete skill tree for a framework

Returns all skills in the framework as a fully nested recursive tree structure. Warning: This can be a heavy query for large frameworks. Requires managing the framework.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.skills_get_full_skill_tree200_response import SkillsGetFullSkillTree200Response
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
    api_instance = openapi_client.SkillsApi(api_client)
    framework_id = 'framework_id_example' # str | 

    try:
        # Get complete skill tree for a framework
        api_response = api_instance.skills_get_full_skill_tree(framework_id)
        print("The response of SkillsApi->skills_get_full_skill_tree:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skills_get_full_skill_tree: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **framework_id** | **str**|  | 

### Return type

[**SkillsGetFullSkillTree200Response**](SkillsGetFullSkillTree200Response.md)

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

# **skills_get_skill**
> SkillsGetSkill200Response skills_get_skill(id, framework_id)

Get a skill by ID

Retrieves a skill by its ID within a specific framework.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.skills_get_skill200_response import SkillsGetSkill200Response
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
    api_instance = openapi_client.SkillsApi(api_client)
    id = 'id_example' # str | 
    framework_id = 'framework_id_example' # str | 

    try:
        # Get a skill by ID
        api_response = api_instance.skills_get_skill(id, framework_id)
        print("The response of SkillsApi->skills_get_skill:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skills_get_skill: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 
 **framework_id** | **str**|  | 

### Return type

[**SkillsGetSkill200Response**](SkillsGetSkill200Response.md)

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

# **skills_get_skill_children_tree**
> SkillsGetFrameworkSkillTree200Response skills_get_skill_children_tree(id, framework_id, limit=limit, cursor=cursor)

Get children for a skill (framework-scoped, paginated)

Returns the first page (or subsequent pages) of children for a given skill within a framework. Each child includes hasChildren and an empty children array.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.skills_get_framework_skill_tree200_response import SkillsGetFrameworkSkillTree200Response
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
    api_instance = openapi_client.SkillsApi(api_client)
    id = 'id_example' # str | 
    framework_id = 'framework_id_example' # str | 
    limit = 25 # int |  (optional) (default to 25)
    cursor = 'cursor_example' # str |  (optional)

    try:
        # Get children for a skill (framework-scoped, paginated)
        api_response = api_instance.skills_get_skill_children_tree(id, framework_id, limit=limit, cursor=cursor)
        print("The response of SkillsApi->skills_get_skill_children_tree:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skills_get_skill_children_tree: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 
 **framework_id** | **str**|  | 
 **limit** | **int**|  | [optional] [default to 25]
 **cursor** | **str**|  | [optional] 

### Return type

[**SkillsGetFrameworkSkillTree200Response**](SkillsGetFrameworkSkillTree200Response.md)

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

# **skills_get_skill_path**
> SkillsGetSkillPath200Response skills_get_skill_path(skill_id, framework_id)

Get breadcrumb path for a skill

Returns the skill and all its ancestors up to the root skill in the framework. Useful for rendering breadcrumbs. Results are ordered from the skill itself up to the root (reverse hierarchical order).

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.skills_get_skill_path200_response import SkillsGetSkillPath200Response
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
    api_instance = openapi_client.SkillsApi(api_client)
    skill_id = 'skill_id_example' # str | 
    framework_id = 'framework_id_example' # str | 

    try:
        # Get breadcrumb path for a skill
        api_response = api_instance.skills_get_skill_path(skill_id, framework_id)
        print("The response of SkillsApi->skills_get_skill_path:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skills_get_skill_path: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **skill_id** | **str**|  | 
 **framework_id** | **str**|  | 

### Return type

[**SkillsGetSkillPath200Response**](SkillsGetSkillPath200Response.md)

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

# **skills_list_skill_tags**
> List[SkillsListSkillTags200ResponseInner] skills_list_skill_tags(id, framework_id)

List tags for a skill

Lists all tags attached to a skill. Requires managing a framework containing the skill.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.skills_list_skill_tags200_response_inner import SkillsListSkillTags200ResponseInner
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
    api_instance = openapi_client.SkillsApi(api_client)
    id = 'id_example' # str | 
    framework_id = 'framework_id_example' # str | 

    try:
        # List tags for a skill
        api_response = api_instance.skills_list_skill_tags(id, framework_id)
        print("The response of SkillsApi->skills_list_skill_tags:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skills_list_skill_tags: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 
 **framework_id** | **str**|  | 

### Return type

[**List[SkillsListSkillTags200ResponseInner]**](SkillsListSkillTags200ResponseInner.md)

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

# **skills_remove_skill_tag**
> SkillFrameworksRemoveFrameworkAdmin200Response skills_remove_skill_tag(id, slug, framework_id)

Remove a tag from a skill

Removes the HAS_TAG relationship from the skill to the tag. Requires managing a framework containing the skill.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.skill_frameworks_remove_framework_admin200_response import SkillFrameworksRemoveFrameworkAdmin200Response
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
    api_instance = openapi_client.SkillsApi(api_client)
    id = 'id_example' # str | 
    slug = 'slug_example' # str | 
    framework_id = 'framework_id_example' # str | 

    try:
        # Remove a tag from a skill
        api_response = api_instance.skills_remove_skill_tag(id, slug, framework_id)
        print("The response of SkillsApi->skills_remove_skill_tag:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skills_remove_skill_tag: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 
 **slug** | **str**|  | 
 **framework_id** | **str**|  | 

### Return type

[**SkillFrameworksRemoveFrameworkAdmin200Response**](SkillFrameworksRemoveFrameworkAdmin200Response.md)

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

# **skills_search_framework_skills**
> BoostSearchSkillsAvailableForBoost200Response skills_search_framework_skills(skills_search_framework_skills_request)

Search skills in a framework

Returns a flattened, paginated list of skills matching the search query. Supports $regex and $in operators. Requires framework management.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.boost_search_skills_available_for_boost200_response import BoostSearchSkillsAvailableForBoost200Response
from openapi_client.models.skills_search_framework_skills_request import SkillsSearchFrameworkSkillsRequest
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
    api_instance = openapi_client.SkillsApi(api_client)
    skills_search_framework_skills_request = openapi_client.SkillsSearchFrameworkSkillsRequest() # SkillsSearchFrameworkSkillsRequest | 

    try:
        # Search skills in a framework
        api_response = api_instance.skills_search_framework_skills(skills_search_framework_skills_request)
        print("The response of SkillsApi->skills_search_framework_skills:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skills_search_framework_skills: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **skills_search_framework_skills_request** | [**SkillsSearchFrameworkSkillsRequest**](SkillsSearchFrameworkSkillsRequest.md)|  | 

### Return type

[**BoostSearchSkillsAvailableForBoost200Response**](BoostSearchSkillsAvailableForBoost200Response.md)

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

# **skills_sync_framework_skills**
> SkillsSyncFrameworkSkills200Response skills_sync_framework_skills(id)

Sync Framework Skills

Fetch skills from the configured provider and upsert them locally, linking to the framework and creating parent relationships

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.skills_sync_framework_skills200_response import SkillsSyncFrameworkSkills200Response
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
    api_instance = openapi_client.SkillsApi(api_client)
    id = 'id_example' # str | 

    try:
        # Sync Framework Skills
        api_response = api_instance.skills_sync_framework_skills(id)
        print("The response of SkillsApi->skills_sync_framework_skills:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skills_sync_framework_skills: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 

### Return type

[**SkillsSyncFrameworkSkills200Response**](SkillsSyncFrameworkSkills200Response.md)

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

# **skills_update**
> SkillsGetSkill200Response skills_update(id, skills_update_request)

Update a skill

Updates a skill within a framework managed by the caller.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.skills_get_skill200_response import SkillsGetSkill200Response
from openapi_client.models.skills_update_request import SkillsUpdateRequest
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
    api_instance = openapi_client.SkillsApi(api_client)
    id = 'id_example' # str | 
    skills_update_request = openapi_client.SkillsUpdateRequest() # SkillsUpdateRequest | 

    try:
        # Update a skill
        api_response = api_instance.skills_update(id, skills_update_request)
        print("The response of SkillsApi->skills_update:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling SkillsApi->skills_update: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | **str**|  | 
 **skills_update_request** | [**SkillsUpdateRequest**](SkillsUpdateRequest.md)|  | 

### Return type

[**SkillsGetSkill200Response**](SkillsGetSkill200Response.md)

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
**404** | Not found |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

