# openapi_client.ActivityApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**activity_get_activity**](ActivityApi.md#activity_get_activity) | **GET** /activity/credentials/{activityId} | Get Credential Activity by ID
[**activity_get_activity_chain**](ActivityApi.md#activity_get_activity_chain) | **GET** /activity/credentials/{activityId}/chain | Get Activity Chain
[**activity_get_activity_stats**](ActivityApi.md#activity_get_activity_stats) | **GET** /activity/credentials/stats | Get Credential Activity Stats
[**activity_get_my_activities**](ActivityApi.md#activity_get_my_activities) | **GET** /activity/credentials | Get Credential Activities


# **activity_get_activity**
> ActivityGetActivity200Response activity_get_activity(activity_id)

Get Credential Activity by ID

Returns details of a specific credential activity by its activity ID. Only returns activities belonging to the authenticated profile.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.activity_get_activity200_response import ActivityGetActivity200Response
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
    api_instance = openapi_client.ActivityApi(api_client)
    activity_id = 'activity_id_example' # str | 

    try:
        # Get Credential Activity by ID
        api_response = api_instance.activity_get_activity(activity_id)
        print("The response of ActivityApi->activity_get_activity:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ActivityApi->activity_get_activity: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **activity_id** | **str**|  | 

### Return type

[**ActivityGetActivity200Response**](ActivityGetActivity200Response.md)

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

# **activity_get_activity_chain**
> List[ActivityGetActivityChain200ResponseInner] activity_get_activity_chain(activity_id)

Get Activity Chain

Returns all events in a credential activity chain by activityId. Shows the full lifecycle (e.g., CREATED → CLAIMED).

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.activity_get_activity_chain200_response_inner import ActivityGetActivityChain200ResponseInner
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
    api_instance = openapi_client.ActivityApi(api_client)
    activity_id = 'activity_id_example' # str | 

    try:
        # Get Activity Chain
        api_response = api_instance.activity_get_activity_chain(activity_id)
        print("The response of ActivityApi->activity_get_activity_chain:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ActivityApi->activity_get_activity_chain: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **activity_id** | **str**|  | 

### Return type

[**List[ActivityGetActivityChain200ResponseInner]**](ActivityGetActivityChain200ResponseInner.md)

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

# **activity_get_activity_stats**
> ActivityGetActivityStats200Response activity_get_activity_stats(boost_uris=boost_uris, integration_id=integration_id)

Get Credential Activity Stats

Returns aggregated statistics for credential activities. Includes counts by status and claim rate.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.activity_get_activity_stats200_response import ActivityGetActivityStats200Response
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
    api_instance = openapi_client.ActivityApi(api_client)
    boost_uris = ['boost_uris_example'] # List[str] |  (optional)
    integration_id = 'integration_id_example' # str |  (optional)

    try:
        # Get Credential Activity Stats
        api_response = api_instance.activity_get_activity_stats(boost_uris=boost_uris, integration_id=integration_id)
        print("The response of ActivityApi->activity_get_activity_stats:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ActivityApi->activity_get_activity_stats: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **boost_uris** | [**List[str]**](str.md)|  | [optional] 
 **integration_id** | **str**|  | [optional] 

### Return type

[**ActivityGetActivityStats200Response**](ActivityGetActivityStats200Response.md)

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

# **activity_get_my_activities**
> ActivityGetMyActivities200Response activity_get_my_activities(limit=limit, cursor=cursor, boost_uri=boost_uri, event_type=event_type, integration_id=integration_id)

Get Credential Activities

Returns a paginated list of credential activities for the authenticated profile. Use this to track what credentials have been sent, claimed, expired, etc.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.activity_get_my_activities200_response import ActivityGetMyActivities200Response
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
    api_instance = openapi_client.ActivityApi(api_client)
    limit = 25 # int |  (optional) (default to 25)
    cursor = 'cursor_example' # str |  (optional)
    boost_uri = 'boost_uri_example' # str |  (optional)
    event_type = 'event_type_example' # str |  (optional)
    integration_id = 'integration_id_example' # str |  (optional)

    try:
        # Get Credential Activities
        api_response = api_instance.activity_get_my_activities(limit=limit, cursor=cursor, boost_uri=boost_uri, event_type=event_type, integration_id=integration_id)
        print("The response of ActivityApi->activity_get_my_activities:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ActivityApi->activity_get_my_activities: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**|  | [optional] [default to 25]
 **cursor** | **str**|  | [optional] 
 **boost_uri** | **str**|  | [optional] 
 **event_type** | **str**|  | [optional] 
 **integration_id** | **str**|  | [optional] 

### Return type

[**ActivityGetMyActivities200Response**](ActivityGetMyActivities200Response.md)

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

