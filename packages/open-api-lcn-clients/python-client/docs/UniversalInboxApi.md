# openapi_client.UniversalInboxApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**federation_receive**](UniversalInboxApi.md#federation_receive) | **POST** /inbox/receive | Receive Federated Inbox Credential
[**inbox_approve_guardian_credential**](UniversalInboxApi.md#inbox_approve_guardian_credential) | **POST** /inbox/guardian-credential-approval/{token}/approve | Approve Guardian Credential
[**inbox_approve_guardian_credential_in_app**](UniversalInboxApi.md#inbox_approve_guardian_credential_in_app) | **POST** /inbox/guardian-credential-approval/in-app/approve | Approve Guardian Credential In-App
[**inbox_approve_guardian_request**](UniversalInboxApi.md#inbox_approve_guardian_request) | **POST** /inbox/guardian-approval/approve | Approve Guardian Request
[**inbox_approve_guardian_request_by_path**](UniversalInboxApi.md#inbox_approve_guardian_request_by_path) | **GET** /inbox/guardian-approval/{token} | Approve Guardian Request (GET)
[**inbox_claim**](UniversalInboxApi.md#inbox_claim) | **POST** /inbox/claim | Claim Universal Inbox Credential
[**inbox_claim_pending_guardian_links**](UniversalInboxApi.md#inbox_claim_pending_guardian_links) | **POST** /inbox/claim-guardian-links | Claim Pending Guardian Links
[**inbox_finalize**](UniversalInboxApi.md#inbox_finalize) | **POST** /inbox/finalize | Finalize Universal Inbox Credentials
[**inbox_get_guardian_pending_credential**](UniversalInboxApi.md#inbox_get_guardian_pending_credential) | **GET** /inbox/guardian-credential-approval/{token} | Get Guardian Pending Credential
[**inbox_get_inbox_credential**](UniversalInboxApi.md#inbox_get_inbox_credential) | **GET** /inbox/credentials/{credentialId} | Get Universal Inbox Credential Details
[**inbox_get_my_issued_credentials**](UniversalInboxApi.md#inbox_get_my_issued_credentials) | **POST** /inbox/issued | Get My Issued Universal Inbox Credentials
[**inbox_issue**](UniversalInboxApi.md#inbox_issue) | **POST** /inbox/issue | Issue Credential to Universal Inbox
[**inbox_reject_guardian_credential**](UniversalInboxApi.md#inbox_reject_guardian_credential) | **POST** /inbox/guardian-credential-approval/{token}/reject | Reject Guardian Credential
[**inbox_reject_guardian_credential_in_app**](UniversalInboxApi.md#inbox_reject_guardian_credential_in_app) | **POST** /inbox/guardian-credential-approval/in-app/reject | Reject Guardian Credential In-App
[**inbox_send_guardian_approval_email**](UniversalInboxApi.md#inbox_send_guardian_approval_email) | **POST** /inbox/guardian-approval/send | Send Guardian Approval Email
[**inbox_send_guardian_challenge**](UniversalInboxApi.md#inbox_send_guardian_challenge) | **POST** /inbox/guardian-credential-approval/{token}/challenge | Send Guardian OTP Challenge


# **federation_receive**
> FederationReceive200Response federation_receive(federation_receive_request)

Receive Federated Inbox Credential

Receives a credential from a federated LearnCard Network instance for delivery to a local user

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.federation_receive200_response import FederationReceive200Response
from openapi_client.models.federation_receive_request import FederationReceiveRequest
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
    federation_receive_request = openapi_client.FederationReceiveRequest() # FederationReceiveRequest | 

    try:
        # Receive Federated Inbox Credential
        api_response = api_instance.federation_receive(federation_receive_request)
        print("The response of UniversalInboxApi->federation_receive:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UniversalInboxApi->federation_receive: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **federation_receive_request** | [**FederationReceiveRequest**](FederationReceiveRequest.md)|  | 

### Return type

[**FederationReceive200Response**](FederationReceive200Response.md)

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

# **inbox_approve_guardian_credential**
> InboxApproveGuardianCredential200Response inbox_approve_guardian_credential(token, inbox_approve_guardian_credential_request)

Approve Guardian Credential

Guardian approves a pending credential. Requires a valid OTP from sendGuardianChallenge. Sets guardianStatus=GUARDIAN_APPROVED and marks isAccepted=true so the recipient can claim it.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.inbox_approve_guardian_credential200_response import InboxApproveGuardianCredential200Response
from openapi_client.models.inbox_approve_guardian_credential_request import InboxApproveGuardianCredentialRequest
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
    inbox_approve_guardian_credential_request = openapi_client.InboxApproveGuardianCredentialRequest() # InboxApproveGuardianCredentialRequest | 

    try:
        # Approve Guardian Credential
        api_response = api_instance.inbox_approve_guardian_credential(token, inbox_approve_guardian_credential_request)
        print("The response of UniversalInboxApi->inbox_approve_guardian_credential:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UniversalInboxApi->inbox_approve_guardian_credential: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **token** | **str**|  | 
 **inbox_approve_guardian_credential_request** | [**InboxApproveGuardianCredentialRequest**](InboxApproveGuardianCredentialRequest.md)|  | 

### Return type

[**InboxApproveGuardianCredential200Response**](InboxApproveGuardianCredential200Response.md)

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

# **inbox_approve_guardian_credential_in_app**
> InboxApproveGuardianCredentialInApp200Response inbox_approve_guardian_credential_in_app(inbox_approve_guardian_credential_in_app_request)

Approve Guardian Credential In-App

Authenticated guardian approves a pending credential. Requires MANAGES relationship with the child. No OTP needed.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.inbox_approve_guardian_credential_in_app200_response import InboxApproveGuardianCredentialInApp200Response
from openapi_client.models.inbox_approve_guardian_credential_in_app_request import InboxApproveGuardianCredentialInAppRequest
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
    inbox_approve_guardian_credential_in_app_request = openapi_client.InboxApproveGuardianCredentialInAppRequest() # InboxApproveGuardianCredentialInAppRequest | 

    try:
        # Approve Guardian Credential In-App
        api_response = api_instance.inbox_approve_guardian_credential_in_app(inbox_approve_guardian_credential_in_app_request)
        print("The response of UniversalInboxApi->inbox_approve_guardian_credential_in_app:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UniversalInboxApi->inbox_approve_guardian_credential_in_app: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **inbox_approve_guardian_credential_in_app_request** | [**InboxApproveGuardianCredentialInAppRequest**](InboxApproveGuardianCredentialInAppRequest.md)|  | 

### Return type

[**InboxApproveGuardianCredentialInApp200Response**](InboxApproveGuardianCredentialInApp200Response.md)

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

# **inbox_claim_pending_guardian_links**
> List[InboxClaimPendingGuardianLinks200ResponseInner] inbox_claim_pending_guardian_links(body)

Claim Pending Guardian Links

After creating a LearnCard account, call this to automatically establish ProfileManager → MANAGES relationships for any credentials previously approved by this email address.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.inbox_claim_pending_guardian_links200_response_inner import InboxClaimPendingGuardianLinks200ResponseInner
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
    body = None # object | 

    try:
        # Claim Pending Guardian Links
        api_response = api_instance.inbox_claim_pending_guardian_links(body)
        print("The response of UniversalInboxApi->inbox_claim_pending_guardian_links:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UniversalInboxApi->inbox_claim_pending_guardian_links: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **body** | **object**|  | 

### Return type

[**List[InboxClaimPendingGuardianLinks200ResponseInner]**](InboxClaimPendingGuardianLinks200ResponseInner.md)

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

Sign and issue all pending inbox credentials for verified contact methods of the authenticated profile. Credentials awaiting guardian approval are skipped and counted in guardianPending.

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

# **inbox_get_guardian_pending_credential**
> InboxGetGuardianPendingCredential200Response inbox_get_guardian_pending_credential(token)

Get Guardian Pending Credential

Returns metadata about a credential awaiting guardian approval. Uses the credential-scoped approval token from the guardian email.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.inbox_get_guardian_pending_credential200_response import InboxGetGuardianPendingCredential200Response
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
        # Get Guardian Pending Credential
        api_response = api_instance.inbox_get_guardian_pending_credential(token)
        print("The response of UniversalInboxApi->inbox_get_guardian_pending_credential:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UniversalInboxApi->inbox_get_guardian_pending_credential: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **token** | **str**|  | 

### Return type

[**InboxGetGuardianPendingCredential200Response**](InboxGetGuardianPendingCredential200Response.md)

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

# **inbox_reject_guardian_credential**
> ContactMethodsSendChallenge200Response inbox_reject_guardian_credential(token, inbox_reject_guardian_credential_request)

Reject Guardian Credential

Guardian rejects a pending credential. Requires a valid OTP from sendGuardianChallenge. Sets guardianStatus=GUARDIAN_REJECTED so the credential will not be claimable.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contact_methods_send_challenge200_response import ContactMethodsSendChallenge200Response
from openapi_client.models.inbox_reject_guardian_credential_request import InboxRejectGuardianCredentialRequest
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
    inbox_reject_guardian_credential_request = openapi_client.InboxRejectGuardianCredentialRequest() # InboxRejectGuardianCredentialRequest | 

    try:
        # Reject Guardian Credential
        api_response = api_instance.inbox_reject_guardian_credential(token, inbox_reject_guardian_credential_request)
        print("The response of UniversalInboxApi->inbox_reject_guardian_credential:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UniversalInboxApi->inbox_reject_guardian_credential: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **token** | **str**|  | 
 **inbox_reject_guardian_credential_request** | [**InboxRejectGuardianCredentialRequest**](InboxRejectGuardianCredentialRequest.md)|  | 

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

# **inbox_reject_guardian_credential_in_app**
> InboxApproveGuardianCredentialInApp200Response inbox_reject_guardian_credential_in_app(inbox_reject_guardian_credential_in_app_request)

Reject Guardian Credential In-App

Authenticated guardian rejects a pending credential. Requires MANAGES relationship with the child. No OTP needed.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.inbox_approve_guardian_credential_in_app200_response import InboxApproveGuardianCredentialInApp200Response
from openapi_client.models.inbox_reject_guardian_credential_in_app_request import InboxRejectGuardianCredentialInAppRequest
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
    inbox_reject_guardian_credential_in_app_request = openapi_client.InboxRejectGuardianCredentialInAppRequest() # InboxRejectGuardianCredentialInAppRequest | 

    try:
        # Reject Guardian Credential In-App
        api_response = api_instance.inbox_reject_guardian_credential_in_app(inbox_reject_guardian_credential_in_app_request)
        print("The response of UniversalInboxApi->inbox_reject_guardian_credential_in_app:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UniversalInboxApi->inbox_reject_guardian_credential_in_app: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **inbox_reject_guardian_credential_in_app_request** | [**InboxRejectGuardianCredentialInAppRequest**](InboxRejectGuardianCredentialInAppRequest.md)|  | 

### Return type

[**InboxApproveGuardianCredentialInApp200Response**](InboxApproveGuardianCredentialInApp200Response.md)

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

# **inbox_send_guardian_challenge**
> ContactMethodsSendChallenge200Response inbox_send_guardian_challenge(token)

Send Guardian OTP Challenge

Sends a 6-digit verification code to the guardian email associated with this approval token. The code must be passed to approve or reject.

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
        # Send Guardian OTP Challenge
        api_response = api_instance.inbox_send_guardian_challenge(token)
        print("The response of UniversalInboxApi->inbox_send_guardian_challenge:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling UniversalInboxApi->inbox_send_guardian_challenge: %s\n" % e)
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
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

