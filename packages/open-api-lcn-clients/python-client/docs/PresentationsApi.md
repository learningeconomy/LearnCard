# openapi_client.PresentationsApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**presentation_accept_presentation**](PresentationsApi.md#presentation_accept_presentation) | **POST** /presentation/accept | Accept a Presentation
[**presentation_delete_presentation**](PresentationsApi.md#presentation_delete_presentation) | **DELETE** /presentation | Delete a presentation
[**presentation_incoming_presentations**](PresentationsApi.md#presentation_incoming_presentations) | **GET** /presentation/incoming | Get incoming presentations
[**presentation_received_presentations**](PresentationsApi.md#presentation_received_presentations) | **GET** /presentation/received | Get received presentations
[**presentation_send_presentation**](PresentationsApi.md#presentation_send_presentation) | **POST** /presentation/send/{profileId} | Send a Presentation
[**presentation_sent_presentations**](PresentationsApi.md#presentation_sent_presentations) | **GET** /presentation/sent | Get sent presentations


# **presentation_accept_presentation**
> bool presentation_accept_presentation(presentation_accept_presentation_request)

Accept a Presentation

This endpoint accepts a presentation

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.presentation_accept_presentation_request import PresentationAcceptPresentationRequest
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
    api_instance = openapi_client.PresentationsApi(api_client)
    presentation_accept_presentation_request = openapi_client.PresentationAcceptPresentationRequest() # PresentationAcceptPresentationRequest | 

    try:
        # Accept a Presentation
        api_response = api_instance.presentation_accept_presentation(presentation_accept_presentation_request)
        print("The response of PresentationsApi->presentation_accept_presentation:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling PresentationsApi->presentation_accept_presentation: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **presentation_accept_presentation_request** | [**PresentationAcceptPresentationRequest**](PresentationAcceptPresentationRequest.md)|  | 

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

# **presentation_delete_presentation**
> bool presentation_delete_presentation(uri)

Delete a presentation

This endpoint deletes a presentation

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
    api_instance = openapi_client.PresentationsApi(api_client)
    uri = 'uri_example' # str | 

    try:
        # Delete a presentation
        api_response = api_instance.presentation_delete_presentation(uri)
        print("The response of PresentationsApi->presentation_delete_presentation:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling PresentationsApi->presentation_delete_presentation: %s\n" % e)
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
**400** | Invalid input data |  -  |
**401** | Authorization not provided |  -  |
**403** | Insufficient access |  -  |
**404** | Not found |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **presentation_incoming_presentations**
> List[CredentialReceivedCredentials200ResponseInner] presentation_incoming_presentations(limit=limit, var_from=var_from)

Get incoming presentations

This endpoint returns the current user's incoming presentations

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.credential_received_credentials200_response_inner import CredentialReceivedCredentials200ResponseInner
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
    api_instance = openapi_client.PresentationsApi(api_client)
    limit = 25 # int |  (optional) (default to 25)
    var_from = 'var_from_example' # str |  (optional)

    try:
        # Get incoming presentations
        api_response = api_instance.presentation_incoming_presentations(limit=limit, var_from=var_from)
        print("The response of PresentationsApi->presentation_incoming_presentations:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling PresentationsApi->presentation_incoming_presentations: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**|  | [optional] [default to 25]
 **var_from** | **str**|  | [optional] 

### Return type

[**List[CredentialReceivedCredentials200ResponseInner]**](CredentialReceivedCredentials200ResponseInner.md)

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

# **presentation_received_presentations**
> List[CredentialReceivedCredentials200ResponseInner] presentation_received_presentations(limit=limit, var_from=var_from)

Get received presentations

This endpoint returns the current user's received presentations

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.credential_received_credentials200_response_inner import CredentialReceivedCredentials200ResponseInner
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
    api_instance = openapi_client.PresentationsApi(api_client)
    limit = 25 # int |  (optional) (default to 25)
    var_from = 'var_from_example' # str |  (optional)

    try:
        # Get received presentations
        api_response = api_instance.presentation_received_presentations(limit=limit, var_from=var_from)
        print("The response of PresentationsApi->presentation_received_presentations:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling PresentationsApi->presentation_received_presentations: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**|  | [optional] [default to 25]
 **var_from** | **str**|  | [optional] 

### Return type

[**List[CredentialReceivedCredentials200ResponseInner]**](CredentialReceivedCredentials200ResponseInner.md)

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

# **presentation_send_presentation**
> str presentation_send_presentation(profile_id, presentation_send_presentation_request)

Send a Presentation

This endpoint sends a presentation to a user based on their profileId

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.presentation_send_presentation_request import PresentationSendPresentationRequest
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
    api_instance = openapi_client.PresentationsApi(api_client)
    profile_id = 'profile_id_example' # str | 
    presentation_send_presentation_request = openapi_client.PresentationSendPresentationRequest() # PresentationSendPresentationRequest | 

    try:
        # Send a Presentation
        api_response = api_instance.presentation_send_presentation(profile_id, presentation_send_presentation_request)
        print("The response of PresentationsApi->presentation_send_presentation:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling PresentationsApi->presentation_send_presentation: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_id** | **str**|  | 
 **presentation_send_presentation_request** | [**PresentationSendPresentationRequest**](PresentationSendPresentationRequest.md)|  | 

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

# **presentation_sent_presentations**
> List[CredentialReceivedCredentials200ResponseInner] presentation_sent_presentations(limit=limit, to=to)

Get sent presentations

This endpoint returns the current user's sent presentations

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.credential_received_credentials200_response_inner import CredentialReceivedCredentials200ResponseInner
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
    api_instance = openapi_client.PresentationsApi(api_client)
    limit = 25 # int |  (optional) (default to 25)
    to = 'to_example' # str |  (optional)

    try:
        # Get sent presentations
        api_response = api_instance.presentation_sent_presentations(limit=limit, to=to)
        print("The response of PresentationsApi->presentation_sent_presentations:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling PresentationsApi->presentation_sent_presentations: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **limit** | **int**|  | [optional] [default to 25]
 **to** | **str**|  | [optional] 

### Return type

[**List[CredentialReceivedCredentials200ResponseInner]**](CredentialReceivedCredentials200ResponseInner.md)

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

