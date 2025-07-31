# openapi_client.CredentialsApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**credential_accept_credential**](CredentialsApi.md#credential_accept_credential) | **POST** /credential/accept | Accept a Credential
[**credential_delete_credential**](CredentialsApi.md#credential_delete_credential) | **DELETE** /credential | Delete a credential
[**credential_incoming_credentials**](CredentialsApi.md#credential_incoming_credentials) | **GET** /credentials/incoming | Get incoming credentials
[**credential_received_credentials**](CredentialsApi.md#credential_received_credentials) | **GET** /credentials/received | Get received credentials
[**credential_send_credential**](CredentialsApi.md#credential_send_credential) | **POST** /credential/send/{profileId} | Send a Credential
[**credential_sent_credentials**](CredentialsApi.md#credential_sent_credentials) | **GET** /credentials/sent | Get sent credentials


# **credential_accept_credential**
> bool credential_accept_credential(credential_accept_credential_request)

Accept a Credential

This endpoint accepts a credential

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.credential_accept_credential_request import CredentialAcceptCredentialRequest
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
    api_instance = openapi_client.CredentialsApi(api_client)
    credential_accept_credential_request = openapi_client.CredentialAcceptCredentialRequest() # CredentialAcceptCredentialRequest | 

    try:
        # Accept a Credential
        api_response = api_instance.credential_accept_credential(credential_accept_credential_request)
        print("The response of CredentialsApi->credential_accept_credential:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling CredentialsApi->credential_accept_credential: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **credential_accept_credential_request** | [**CredentialAcceptCredentialRequest**](CredentialAcceptCredentialRequest.md)|  | 

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

# **credential_delete_credential**
> bool credential_delete_credential(uri)

Delete a credential

This endpoint deletes a credential

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
    api_instance = openapi_client.CredentialsApi(api_client)
    uri = 'uri_example' # str | 

    try:
        # Delete a credential
        api_response = api_instance.credential_delete_credential(uri)
        print("The response of CredentialsApi->credential_delete_credential:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling CredentialsApi->credential_delete_credential: %s\n" % e)
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

# **credential_incoming_credentials**
> List[CredentialReceivedCredentials200ResponseInner] credential_incoming_credentials(limit=limit, var_from=var_from)

Get incoming credentials

This endpoint returns the current user's incoming credentials

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
    api_instance = openapi_client.CredentialsApi(api_client)
    limit = 25 # int |  (optional) (default to 25)
    var_from = 'var_from_example' # str |  (optional)

    try:
        # Get incoming credentials
        api_response = api_instance.credential_incoming_credentials(limit=limit, var_from=var_from)
        print("The response of CredentialsApi->credential_incoming_credentials:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling CredentialsApi->credential_incoming_credentials: %s\n" % e)
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

# **credential_received_credentials**
> List[CredentialReceivedCredentials200ResponseInner] credential_received_credentials(limit=limit, var_from=var_from)

Get received credentials

This endpoint returns the current user's received credentials

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
    api_instance = openapi_client.CredentialsApi(api_client)
    limit = 25 # int |  (optional) (default to 25)
    var_from = 'var_from_example' # str |  (optional)

    try:
        # Get received credentials
        api_response = api_instance.credential_received_credentials(limit=limit, var_from=var_from)
        print("The response of CredentialsApi->credential_received_credentials:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling CredentialsApi->credential_received_credentials: %s\n" % e)
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

# **credential_send_credential**
> str credential_send_credential(profile_id, credential_send_credential_request)

Send a Credential

This endpoint sends a credential to a user based on their profileId

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.credential_send_credential_request import CredentialSendCredentialRequest
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
    api_instance = openapi_client.CredentialsApi(api_client)
    profile_id = 'profile_id_example' # str | 
    credential_send_credential_request = openapi_client.CredentialSendCredentialRequest() # CredentialSendCredentialRequest | 

    try:
        # Send a Credential
        api_response = api_instance.credential_send_credential(profile_id, credential_send_credential_request)
        print("The response of CredentialsApi->credential_send_credential:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling CredentialsApi->credential_send_credential: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **profile_id** | **str**|  | 
 **credential_send_credential_request** | [**CredentialSendCredentialRequest**](CredentialSendCredentialRequest.md)|  | 

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

# **credential_sent_credentials**
> List[CredentialReceivedCredentials200ResponseInner] credential_sent_credentials(limit=limit, to=to)

Get sent credentials

This endpoint returns the current user's sent credentials

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
    api_instance = openapi_client.CredentialsApi(api_client)
    limit = 25 # int |  (optional) (default to 25)
    to = 'to_example' # str |  (optional)

    try:
        # Get sent credentials
        api_response = api_instance.credential_sent_credentials(limit=limit, to=to)
        print("The response of CredentialsApi->credential_sent_credentials:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling CredentialsApi->credential_sent_credentials: %s\n" % e)
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

