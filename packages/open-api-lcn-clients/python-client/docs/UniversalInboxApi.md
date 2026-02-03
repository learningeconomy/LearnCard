# openapi_client.UniversalInboxApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**inbox_approve_guardian_request**](UniversalInboxApi.md#inbox_approve_guardian_request) | **POST** /inbox/guardian-approval/approve | Approve Guardian Request
[**inbox_approve_guardian_request_by_path**](UniversalInboxApi.md#inbox_approve_guardian_request_by_path) | **GET** /inbox/guardian-approval/{token} | Approve Guardian Request (GET)
[**inbox_claim**](UniversalInboxApi.md#inbox_claim) | **POST** /inbox/claim | Claim Universal Inbox Credential
[**inbox_finalize**](UniversalInboxApi.md#inbox_finalize) | **POST** /inbox/finalize | Finalize Universal Inbox Credentials
[**inbox_get_inbox_credential**](UniversalInboxApi.md#inbox_get_inbox_credential) | **GET** /inbox/credentials/{credentialId} | Get Universal Inbox Credential Details
[**inbox_get_my_issued_credentials**](UniversalInboxApi.md#inbox_get_my_issued_credentials) | **POST** /inbox/issued | Get My Issued Universal Inbox Credentials
[**inbox_issue**](UniversalInboxApi.md#inbox_issue) | **POST** /inbox/issue | Issue Credential to Universal Inbox
[**inbox_send_guardian_approval_email**](UniversalInboxApi.md#inbox_send_guardian_approval_email) | **POST** /inbox/guardian-approval/send | Send Guardian Approval Email


# **inbox_approve_guardian_request**
> ContactMethodsSendChallenge200Response inbox_approve_guardian_request(inbox_approve_guardian_request_request)

Approve Guardian Request

Consumes a guardian approval token and marks the requesting user profile as approved.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contact_methods_send_challenge200_response import ContactMethodsSendChallenge200Response
from openapi_client.models.inbox_approve_guardian_request_request import InboxApproveGuardianRequestRequest
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
    inbox_approve_guardian_request_request = openapi_client.InboxApproveGuardianRequestRequest() # InboxApproveGuardianRequestRequest | 

    try:
        # Approve Guardian Request
        api_response = api_instance.inbox_approve_guardian_request(inbox_approve_guardian_request_request)
        print("The response of UniversalInboxApi->inbox_approve_guardian_request:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UniversalInboxApi->inbox_approve_guardian_request: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **inbox_approve_guardian_request_request** | [**InboxApproveGuardianRequestRequest**](InboxApproveGuardianRequestRequest.md)|  | 

### Return type

[**ContactMethodsSendChallenge200Response**](ContactMethodsSendChallenge200Response.md)

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

# **inbox_approve_guardian_request_by_path**
> ContactMethodsSendChallenge200Response inbox_approve_guardian_request_by_path(token)

Approve Guardian Request (GET)

GET endpoint to consume guardian approval token from URL path.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contact_methods_send_challenge200_response import ContactMethodsSendChallenge200Response
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
    token = 'token_example' # str | 

    try:
        # Approve Guardian Request (GET)
        api_response = api_instance.inbox_approve_guardian_request_by_path(token)
        print("The response of UniversalInboxApi->inbox_approve_guardian_request_by_path:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UniversalInboxApi->inbox_approve_guardian_request_by_path: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **token** | **str**|  | 

### Return type

[**ContactMethodsSendChallenge200Response**](ContactMethodsSendChallenge200Response.md)

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

# **inbox_claim**
> InboxClaim200Response inbox_claim(inbox_claim_request)

Claim Universal Inbox Credential

Claim a credential from the inbox

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.inbox_claim200_response import InboxClaim200Response
from openapi_client.models.inbox_claim_request import InboxClaimRequest
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
    inbox_claim_request = openapi_client.InboxClaimRequest() # InboxClaimRequest | 

    try:
        # Claim Universal Inbox Credential
        api_response = api_instance.inbox_claim(inbox_claim_request)
        print("The response of UniversalInboxApi->inbox_claim:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UniversalInboxApi->inbox_claim: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **inbox_claim_request** | [**InboxClaimRequest**](InboxClaimRequest.md)|  | 

### Return type

[**InboxClaim200Response**](InboxClaim200Response.md)

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

# **inbox_finalize**
> InboxFinalize200Response inbox_finalize(body=body)

Finalize Universal Inbox Credentials

Sign and issue all pending inbox credentials for verified contact methods of the authenticated profile

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.inbox_finalize200_response import InboxFinalize200Response
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
    body = None # object |  (optional)

    try:
        # Finalize Universal Inbox Credentials
        api_response = api_instance.inbox_finalize(body=body)
        print("The response of UniversalInboxApi->inbox_finalize:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UniversalInboxApi->inbox_finalize: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **body** | **object**|  | [optional] 

### Return type

[**InboxFinalize200Response**](InboxFinalize200Response.md)

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

Issue a credential to a recipient's inbox. If the recipient exists with a verified email, the credential is auto-delivered. Supports either a credential object or a templateUri to resolve the credential from a boost template.

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

# **inbox_send_guardian_approval_email**
> InboxSendGuardianApprovalEmail200Response inbox_send_guardian_approval_email(inbox_send_guardian_approval_email_request)

Send Guardian Approval Email

Generates a one-time approval token and emails a link to the guardian. When the link is consumed, the requester's profile will be marked as approved.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.inbox_send_guardian_approval_email200_response import InboxSendGuardianApprovalEmail200Response
from openapi_client.models.inbox_send_guardian_approval_email_request import InboxSendGuardianApprovalEmailRequest
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
    inbox_send_guardian_approval_email_request = openapi_client.InboxSendGuardianApprovalEmailRequest() # InboxSendGuardianApprovalEmailRequest | 

    try:
        # Send Guardian Approval Email
        api_response = api_instance.inbox_send_guardian_approval_email(inbox_send_guardian_approval_email_request)
        print("The response of UniversalInboxApi->inbox_send_guardian_approval_email:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UniversalInboxApi->inbox_send_guardian_approval_email: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **inbox_send_guardian_approval_email_request** | [**InboxSendGuardianApprovalEmailRequest**](InboxSendGuardianApprovalEmailRequest.md)|  | 

### Return type

[**InboxSendGuardianApprovalEmail200Response**](InboxSendGuardianApprovalEmail200Response.md)

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

