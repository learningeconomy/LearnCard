# openapi_client.UniversalInboxApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**inbox_get_inbox_credential**](UniversalInboxApi.md#inbox_get_inbox_credential) | **GET** /inbox/credentials/{credentialId} | Get Universal Inbox Credential Details
[**inbox_get_my_issued_credentials**](UniversalInboxApi.md#inbox_get_my_issued_credentials) | **POST** /inbox/issued | Get My Issued Universal Inbox Credentials
[**inbox_issue**](UniversalInboxApi.md#inbox_issue) | **POST** /inbox/issue | Issue Credential to Universal Inbox


# **inbox_get_inbox_credential**
> InboxGetMyIssuedCredentials200ResponseRecordsInner inbox_get_inbox_credential(credential_id)

Get Universal Inbox Credential Details

Get details of a specific inbox credential (if owned by the authenticated profile)

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.inbox_get_my_issued_credentials200_response_records_inner import InboxGetMyIssuedCredentials200ResponseRecordsInner
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
    api_instance = openapi_client.UniversalInboxApi(api_client)
    credential_id = 'credential_id_example' # str | 

    try:
        # Get Universal Inbox Credential Details
        api_response = api_instance.inbox_get_inbox_credential(credential_id)
        print("The response of UniversalInboxApi->inbox_get_inbox_credential:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UniversalInboxApi->inbox_get_inbox_credential: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **credential_id** | **str**|  | 

### Return type

[**InboxGetMyIssuedCredentials200ResponseRecordsInner**](InboxGetMyIssuedCredentials200ResponseRecordsInner.md)

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

# **inbox_get_my_issued_credentials**
> InboxGetMyIssuedCredentials200Response inbox_get_my_issued_credentials(inbox_get_my_issued_credentials_request=inbox_get_my_issued_credentials_request)

Get My Issued Universal Inbox Credentials

Get all inbox credentials issued by the authenticated profile

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.inbox_get_my_issued_credentials200_response import InboxGetMyIssuedCredentials200Response
from openapi_client.models.inbox_get_my_issued_credentials_request import InboxGetMyIssuedCredentialsRequest
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
    api_instance = openapi_client.UniversalInboxApi(api_client)
    inbox_get_my_issued_credentials_request = openapi_client.InboxGetMyIssuedCredentialsRequest() # InboxGetMyIssuedCredentialsRequest |  (optional)

    try:
        # Get My Issued Universal Inbox Credentials
        api_response = api_instance.inbox_get_my_issued_credentials(inbox_get_my_issued_credentials_request=inbox_get_my_issued_credentials_request)
        print("The response of UniversalInboxApi->inbox_get_my_issued_credentials:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UniversalInboxApi->inbox_get_my_issued_credentials: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **inbox_get_my_issued_credentials_request** | [**InboxGetMyIssuedCredentialsRequest**](InboxGetMyIssuedCredentialsRequest.md)|  | [optional] 

### Return type

[**InboxGetMyIssuedCredentials200Response**](InboxGetMyIssuedCredentials200Response.md)

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

# **inbox_issue**
> InboxIssue200Response inbox_issue(inbox_issue_request)

Issue Credential to Universal Inbox

Issue a credential to a recipient's inbox. If the recipient exists with a verified email, the credential is auto-delivered.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.inbox_issue200_response import InboxIssue200Response
from openapi_client.models.inbox_issue_request import InboxIssueRequest
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
    api_instance = openapi_client.UniversalInboxApi(api_client)
    inbox_issue_request = openapi_client.InboxIssueRequest() # InboxIssueRequest | 

    try:
        # Issue Credential to Universal Inbox
        api_response = api_instance.inbox_issue(inbox_issue_request)
        print("The response of UniversalInboxApi->inbox_issue:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UniversalInboxApi->inbox_issue: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **inbox_issue_request** | [**InboxIssueRequest**](InboxIssueRequest.md)|  | 

### Return type

[**InboxIssue200Response**](InboxIssue200Response.md)

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

