# openapi_client.ContractsApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**contracts_add_auto_boosts_to_contract**](ContractsApi.md#contracts_add_auto_boosts_to_contract) | **POST** /consent-flow-contracts/autoboosts/add | Add autoboosts to a contract
[**contracts_cancel_contract_request**](ContractsApi.md#contracts_cancel_contract_request) | **POST** /consent-flow-contracts/cancel-request | Cancels/removes a contract request
[**contracts_consent_to_contract**](ContractsApi.md#contracts_consent_to_contract) | **POST** /consent-flow-contract/consent | Consent To Contract
[**contracts_create_consent_flow_contract**](ContractsApi.md#contracts_create_consent_flow_contract) | **POST** /consent-flow-contract | Create Consent Flow Contract
[**contracts_delete_consent_flow_contract**](ContractsApi.md#contracts_delete_consent_flow_contract) | **DELETE** /consent-flow-contract | Delete a Consent Flow Contract
[**contracts_forward_contract_request_to_profile**](ContractsApi.md#contracts_forward_contract_request_to_profile) | **POST** /consent-flow-contracts/forward-request-to-profile | Forward a contract request
[**contracts_get_all_contract_requests_for_profile**](ContractsApi.md#contracts_get_all_contract_requests_for_profile) | **GET** /consent-flow-contracts/all-requests-for-profile | Get all contract requests for a target profile
[**contracts_get_all_credentials_for_terms**](ContractsApi.md#contracts_get_all_credentials_for_terms) | **POST** /consent-flow-contracts/credentials | Get all credentials written to any terms
[**contracts_get_consent_flow_contract**](ContractsApi.md#contracts_get_consent_flow_contract) | **GET** /consent-flow-contract | Get Consent Flow Contracts
[**contracts_get_consent_flow_contracts**](ContractsApi.md#contracts_get_consent_flow_contracts) | **POST** /consent-flow-contracts | Get Consent Flow Contracts
[**contracts_get_consented_contracts**](ContractsApi.md#contracts_get_consented_contracts) | **POST** /consent-flow-contracts/consent | Gets Consented Contracts
[**contracts_get_consented_data**](ContractsApi.md#contracts_get_consented_data) | **POST** /consent-flow-contract/data | Get the data that has been consented for all of your contracts
[**contracts_get_consented_data_for_contract**](ContractsApi.md#contracts_get_consented_data_for_contract) | **POST** /consent-flow-contract/data-for-contract | Get the data that has been consented for a contract
[**contracts_get_consented_data_for_did**](ContractsApi.md#contracts_get_consented_data_for_did) | **POST** /consent-flow-contract/data-for-did | Get the data that has been consented by a did
[**contracts_get_contract_sent_requests**](ContractsApi.md#contracts_get_contract_sent_requests) | **GET** /consent-flow-contracts/sent-requests | Get requests sent for a given contract
[**contracts_get_credentials_for_contract**](ContractsApi.md#contracts_get_credentials_for_contract) | **POST** /consent-flow-contract/credentials | Get credentials issued via a contract
[**contracts_get_request_status_for_profile**](ContractsApi.md#contracts_get_request_status_for_profile) | **GET** /consent-flow-contracts/request-status | Get request status for a specific profile under a contract
[**contracts_get_terms_transaction_history**](ContractsApi.md#contracts_get_terms_transaction_history) | **POST** /consent-flow-contract/consent/history | Gets Transaction History
[**contracts_mark_contract_request_as_seen**](ContractsApi.md#contracts_mark_contract_request_as_seen) | **POST** /consent-flow-contracts/mark-request-as-seen | Marks a contract request as seen
[**contracts_remove_auto_boosts_from_contract**](ContractsApi.md#contracts_remove_auto_boosts_from_contract) | **POST** /consent-flow-contracts/autoboosts/remove | Remove autoboosts from a contract
[**contracts_send_ai_insight_share_request**](ContractsApi.md#contracts_send_ai_insight_share_request) | **POST** /consent-flow-contracts/ai-insights/share-request | AI Insights, consent flow share-notifcation request
[**contracts_send_ai_insights_contract_request**](ContractsApi.md#contracts_send_ai_insights_contract_request) | **POST** /consent-flow-contracts/ai-insights/request | AI Insights, consent flow notifcation request
[**contracts_sync_credentials_to_contract**](ContractsApi.md#contracts_sync_credentials_to_contract) | **POST** /consent-flow-contract/sync | Sync credentials to a contract
[**contracts_update_consented_contract_terms**](ContractsApi.md#contracts_update_consented_contract_terms) | **POST** /consent-flow-contract/consent/update | Updates Contract Terms
[**contracts_verify_consent**](ContractsApi.md#contracts_verify_consent) | **GET** /consent-flow-contract/verify | Verifies that a profile has consented to a contract
[**contracts_withdraw_consent**](ContractsApi.md#contracts_withdraw_consent) | **DELETE** /consent-flow-contract/consent/withdraw | Deletes Contract Terms
[**contracts_write_credential_to_contract**](ContractsApi.md#contracts_write_credential_to_contract) | **POST** /consent-flow-contract/write | Writes a boost credential to a did that has consented to a contract
[**contracts_write_credential_to_contract_via_signing_authority**](ContractsApi.md#contracts_write_credential_to_contract_via_signing_authority) | **POST** /consent-flow-contract/write/via-signing-authority | Write credential through signing authority for a DID consented to a contract


# **contracts_add_auto_boosts_to_contract**
> bool contracts_add_auto_boosts_to_contract(contracts_add_auto_boosts_to_contract_request)

Add autoboosts to a contract

Adds one or more autoboost configurations to an existing consent flow contract. The caller must be the contract owner or a designated writer. The signing authority for each autoboost must be registered to the caller.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_add_auto_boosts_to_contract_request import ContractsAddAutoBoostsToContractRequest
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
    api_instance = openapi_client.ContractsApi(api_client)
    contracts_add_auto_boosts_to_contract_request = openapi_client.ContractsAddAutoBoostsToContractRequest() # ContractsAddAutoBoostsToContractRequest | 

    try:
        # Add autoboosts to a contract
        api_response = api_instance.contracts_add_auto_boosts_to_contract(contracts_add_auto_boosts_to_contract_request)
        print("The response of ContractsApi->contracts_add_auto_boosts_to_contract:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_add_auto_boosts_to_contract: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_add_auto_boosts_to_contract_request** | [**ContractsAddAutoBoostsToContractRequest**](ContractsAddAutoBoostsToContractRequest.md)|  | 

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

# **contracts_cancel_contract_request**
> bool contracts_cancel_contract_request(contracts_cancel_contract_request_request)

Cancels/removes a contract request

Removes a REQUESTED_FOR relationship, cancelling the request sent to the specified target profile. Only contract writers are authorized to perform this action.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_cancel_contract_request_request import ContractsCancelContractRequestRequest
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
    api_instance = openapi_client.ContractsApi(api_client)
    contracts_cancel_contract_request_request = openapi_client.ContractsCancelContractRequestRequest() # ContractsCancelContractRequestRequest | 

    try:
        # Cancels/removes a contract request
        api_response = api_instance.contracts_cancel_contract_request(contracts_cancel_contract_request_request)
        print("The response of ContractsApi->contracts_cancel_contract_request:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_cancel_contract_request: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_cancel_contract_request_request** | [**ContractsCancelContractRequestRequest**](ContractsCancelContractRequestRequest.md)|  | 

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

# **contracts_consent_to_contract**
> ContractsConsentToContract200Response contracts_consent_to_contract(contracts_consent_to_contract_request)

Consent To Contract

Consents to a Contract with a hard set of terms

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_consent_to_contract200_response import ContractsConsentToContract200Response
from openapi_client.models.contracts_consent_to_contract_request import ContractsConsentToContractRequest
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
    api_instance = openapi_client.ContractsApi(api_client)
    contracts_consent_to_contract_request = openapi_client.ContractsConsentToContractRequest() # ContractsConsentToContractRequest | 

    try:
        # Consent To Contract
        api_response = api_instance.contracts_consent_to_contract(contracts_consent_to_contract_request)
        print("The response of ContractsApi->contracts_consent_to_contract:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_consent_to_contract: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_consent_to_contract_request** | [**ContractsConsentToContractRequest**](ContractsConsentToContractRequest.md)|  | 

### Return type

[**ContractsConsentToContract200Response**](ContractsConsentToContract200Response.md)

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

# **contracts_create_consent_flow_contract**
> str contracts_create_consent_flow_contract(contracts_create_consent_flow_contract_request)

Create Consent Flow Contract

Creates a Consent Flow Contract for a profile

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_create_consent_flow_contract_request import ContractsCreateConsentFlowContractRequest
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
    api_instance = openapi_client.ContractsApi(api_client)
    contracts_create_consent_flow_contract_request = openapi_client.ContractsCreateConsentFlowContractRequest() # ContractsCreateConsentFlowContractRequest | 

    try:
        # Create Consent Flow Contract
        api_response = api_instance.contracts_create_consent_flow_contract(contracts_create_consent_flow_contract_request)
        print("The response of ContractsApi->contracts_create_consent_flow_contract:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_create_consent_flow_contract: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_create_consent_flow_contract_request** | [**ContractsCreateConsentFlowContractRequest**](ContractsCreateConsentFlowContractRequest.md)|  | 

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

# **contracts_delete_consent_flow_contract**
> bool contracts_delete_consent_flow_contract(uri)

Delete a Consent Flow Contract

This route deletes a Consent Flow Contract

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
    api_instance = openapi_client.ContractsApi(api_client)
    uri = 'uri_example' # str | 

    try:
        # Delete a Consent Flow Contract
        api_response = api_instance.contracts_delete_consent_flow_contract(uri)
        print("The response of ContractsApi->contracts_delete_consent_flow_contract:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_delete_consent_flow_contract: %s\n" % e)
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

# **contracts_forward_contract_request_to_profile**
> bool contracts_forward_contract_request_to_profile(contracts_forward_contract_request_to_profile_request)

Forward a contract request

Forwards a contract request to another profile

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_forward_contract_request_to_profile_request import ContractsForwardContractRequestToProfileRequest
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
    api_instance = openapi_client.ContractsApi(api_client)
    contracts_forward_contract_request_to_profile_request = openapi_client.ContractsForwardContractRequestToProfileRequest() # ContractsForwardContractRequestToProfileRequest | 

    try:
        # Forward a contract request
        api_response = api_instance.contracts_forward_contract_request_to_profile(contracts_forward_contract_request_to_profile_request)
        print("The response of ContractsApi->contracts_forward_contract_request_to_profile:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_forward_contract_request_to_profile: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_forward_contract_request_to_profile_request** | [**ContractsForwardContractRequestToProfileRequest**](ContractsForwardContractRequestToProfileRequest.md)|  | 

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

# **contracts_get_all_contract_requests_for_profile**
> List[ContractsGetAllContractRequestsForProfile200ResponseInner] contracts_get_all_contract_requests_for_profile(target_profile_id)

Get all contract requests for a target profile

Gets all contract requests from all contracts for a specified target profile. Users can query their own requests.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_get_all_contract_requests_for_profile200_response_inner import ContractsGetAllContractRequestsForProfile200ResponseInner
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
    api_instance = openapi_client.ContractsApi(api_client)
    target_profile_id = 'target_profile_id_example' # str | 

    try:
        # Get all contract requests for a target profile
        api_response = api_instance.contracts_get_all_contract_requests_for_profile(target_profile_id)
        print("The response of ContractsApi->contracts_get_all_contract_requests_for_profile:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_get_all_contract_requests_for_profile: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **target_profile_id** | **str**|  | 

### Return type

[**List[ContractsGetAllContractRequestsForProfile200ResponseInner]**](ContractsGetAllContractRequestsForProfile200ResponseInner.md)

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

# **contracts_get_all_credentials_for_terms**
> ContractsGetCredentialsForContract200Response contracts_get_all_credentials_for_terms(contracts_get_all_credentials_for_terms_request=contracts_get_all_credentials_for_terms_request)

Get all credentials written to any terms

Gets all credentials that were written to any terms owned by this profile

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_get_all_credentials_for_terms_request import ContractsGetAllCredentialsForTermsRequest
from openapi_client.models.contracts_get_credentials_for_contract200_response import ContractsGetCredentialsForContract200Response
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
    api_instance = openapi_client.ContractsApi(api_client)
    contracts_get_all_credentials_for_terms_request = openapi_client.ContractsGetAllCredentialsForTermsRequest() # ContractsGetAllCredentialsForTermsRequest |  (optional)

    try:
        # Get all credentials written to any terms
        api_response = api_instance.contracts_get_all_credentials_for_terms(contracts_get_all_credentials_for_terms_request=contracts_get_all_credentials_for_terms_request)
        print("The response of ContractsApi->contracts_get_all_credentials_for_terms:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_get_all_credentials_for_terms: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_get_all_credentials_for_terms_request** | [**ContractsGetAllCredentialsForTermsRequest**](ContractsGetAllCredentialsForTermsRequest.md)|  | [optional] 

### Return type

[**ContractsGetCredentialsForContract200Response**](ContractsGetCredentialsForContract200Response.md)

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

# **contracts_get_consent_flow_contract**
> ContractsGetConsentFlowContract200Response contracts_get_consent_flow_contract(uri)

Get Consent Flow Contracts

Gets Consent Flow Contract Details

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_get_consent_flow_contract200_response import ContractsGetConsentFlowContract200Response
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
    api_instance = openapi_client.ContractsApi(api_client)
    uri = 'uri_example' # str | 

    try:
        # Get Consent Flow Contracts
        api_response = api_instance.contracts_get_consent_flow_contract(uri)
        print("The response of ContractsApi->contracts_get_consent_flow_contract:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_get_consent_flow_contract: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **uri** | **str**|  | 

### Return type

[**ContractsGetConsentFlowContract200Response**](ContractsGetConsentFlowContract200Response.md)

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

# **contracts_get_consent_flow_contracts**
> ContractsGetConsentFlowContracts200Response contracts_get_consent_flow_contracts(contracts_get_consent_flow_contracts_request=contracts_get_consent_flow_contracts_request)

Get Consent Flow Contracts

Gets Consent Flow Contracts for a profile

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_get_consent_flow_contracts200_response import ContractsGetConsentFlowContracts200Response
from openapi_client.models.contracts_get_consent_flow_contracts_request import ContractsGetConsentFlowContractsRequest
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
    api_instance = openapi_client.ContractsApi(api_client)
    contracts_get_consent_flow_contracts_request = openapi_client.ContractsGetConsentFlowContractsRequest() # ContractsGetConsentFlowContractsRequest |  (optional)

    try:
        # Get Consent Flow Contracts
        api_response = api_instance.contracts_get_consent_flow_contracts(contracts_get_consent_flow_contracts_request=contracts_get_consent_flow_contracts_request)
        print("The response of ContractsApi->contracts_get_consent_flow_contracts:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_get_consent_flow_contracts: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_get_consent_flow_contracts_request** | [**ContractsGetConsentFlowContractsRequest**](ContractsGetConsentFlowContractsRequest.md)|  | [optional] 

### Return type

[**ContractsGetConsentFlowContracts200Response**](ContractsGetConsentFlowContracts200Response.md)

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

# **contracts_get_consented_contracts**
> ContractsGetConsentedContracts200Response contracts_get_consented_contracts(contracts_get_consented_contracts_request=contracts_get_consented_contracts_request)

Gets Consented Contracts

Gets all consented contracts for a user

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_get_consented_contracts200_response import ContractsGetConsentedContracts200Response
from openapi_client.models.contracts_get_consented_contracts_request import ContractsGetConsentedContractsRequest
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
    api_instance = openapi_client.ContractsApi(api_client)
    contracts_get_consented_contracts_request = openapi_client.ContractsGetConsentedContractsRequest() # ContractsGetConsentedContractsRequest |  (optional)

    try:
        # Gets Consented Contracts
        api_response = api_instance.contracts_get_consented_contracts(contracts_get_consented_contracts_request=contracts_get_consented_contracts_request)
        print("The response of ContractsApi->contracts_get_consented_contracts:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_get_consented_contracts: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_get_consented_contracts_request** | [**ContractsGetConsentedContractsRequest**](ContractsGetConsentedContractsRequest.md)|  | [optional] 

### Return type

[**ContractsGetConsentedContracts200Response**](ContractsGetConsentedContracts200Response.md)

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

# **contracts_get_consented_data**
> ContractsGetConsentedData200Response contracts_get_consented_data(contracts_get_consented_data_request=contracts_get_consented_data_request)

Get the data that has been consented for all of your contracts

This route grabs all the data that has been consented for all of your contracts

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_get_consented_data200_response import ContractsGetConsentedData200Response
from openapi_client.models.contracts_get_consented_data_request import ContractsGetConsentedDataRequest
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
    api_instance = openapi_client.ContractsApi(api_client)
    contracts_get_consented_data_request = openapi_client.ContractsGetConsentedDataRequest() # ContractsGetConsentedDataRequest |  (optional)

    try:
        # Get the data that has been consented for all of your contracts
        api_response = api_instance.contracts_get_consented_data(contracts_get_consented_data_request=contracts_get_consented_data_request)
        print("The response of ContractsApi->contracts_get_consented_data:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_get_consented_data: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_get_consented_data_request** | [**ContractsGetConsentedDataRequest**](ContractsGetConsentedDataRequest.md)|  | [optional] 

### Return type

[**ContractsGetConsentedData200Response**](ContractsGetConsentedData200Response.md)

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

# **contracts_get_consented_data_for_contract**
> ContractsGetConsentedDataForContract200Response contracts_get_consented_data_for_contract(contracts_get_consented_data_for_contract_request)

Get the data that has been consented for a contract

This route grabs all the data that has been consented for a contract

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_get_consented_data_for_contract200_response import ContractsGetConsentedDataForContract200Response
from openapi_client.models.contracts_get_consented_data_for_contract_request import ContractsGetConsentedDataForContractRequest
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
    api_instance = openapi_client.ContractsApi(api_client)
    contracts_get_consented_data_for_contract_request = openapi_client.ContractsGetConsentedDataForContractRequest() # ContractsGetConsentedDataForContractRequest | 

    try:
        # Get the data that has been consented for a contract
        api_response = api_instance.contracts_get_consented_data_for_contract(contracts_get_consented_data_for_contract_request)
        print("The response of ContractsApi->contracts_get_consented_data_for_contract:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_get_consented_data_for_contract: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_get_consented_data_for_contract_request** | [**ContractsGetConsentedDataForContractRequest**](ContractsGetConsentedDataForContractRequest.md)|  | 

### Return type

[**ContractsGetConsentedDataForContract200Response**](ContractsGetConsentedDataForContract200Response.md)

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

# **contracts_get_consented_data_for_did**
> ContractsGetConsentedDataForDid200Response contracts_get_consented_data_for_did(contracts_get_consented_data_for_did_request)

Get the data that has been consented by a did

This route grabs all the data that has been consented by a did

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_get_consented_data_for_did200_response import ContractsGetConsentedDataForDid200Response
from openapi_client.models.contracts_get_consented_data_for_did_request import ContractsGetConsentedDataForDidRequest
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
    api_instance = openapi_client.ContractsApi(api_client)
    contracts_get_consented_data_for_did_request = openapi_client.ContractsGetConsentedDataForDidRequest() # ContractsGetConsentedDataForDidRequest | 

    try:
        # Get the data that has been consented by a did
        api_response = api_instance.contracts_get_consented_data_for_did(contracts_get_consented_data_for_did_request)
        print("The response of ContractsApi->contracts_get_consented_data_for_did:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_get_consented_data_for_did: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_get_consented_data_for_did_request** | [**ContractsGetConsentedDataForDidRequest**](ContractsGetConsentedDataForDidRequest.md)|  | 

### Return type

[**ContractsGetConsentedDataForDid200Response**](ContractsGetConsentedDataForDid200Response.md)

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

# **contracts_get_contract_sent_requests**
> List[ContractsGetContractSentRequests200ResponseInner] contracts_get_contract_sent_requests(contract_uri)

Get requests sent for a given contract

Gets a list of users and their request statuses for a given contract.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_get_contract_sent_requests200_response_inner import ContractsGetContractSentRequests200ResponseInner
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
    api_instance = openapi_client.ContractsApi(api_client)
    contract_uri = 'contract_uri_example' # str | 

    try:
        # Get requests sent for a given contract
        api_response = api_instance.contracts_get_contract_sent_requests(contract_uri)
        print("The response of ContractsApi->contracts_get_contract_sent_requests:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_get_contract_sent_requests: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contract_uri** | **str**|  | 

### Return type

[**List[ContractsGetContractSentRequests200ResponseInner]**](ContractsGetContractSentRequests200ResponseInner.md)

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

# **contracts_get_credentials_for_contract**
> ContractsGetCredentialsForContract200Response contracts_get_credentials_for_contract(contracts_get_credentials_for_contract_request)

Get credentials issued via a contract

Gets all credentials that were issued via a contract

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_get_credentials_for_contract200_response import ContractsGetCredentialsForContract200Response
from openapi_client.models.contracts_get_credentials_for_contract_request import ContractsGetCredentialsForContractRequest
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
    api_instance = openapi_client.ContractsApi(api_client)
    contracts_get_credentials_for_contract_request = openapi_client.ContractsGetCredentialsForContractRequest() # ContractsGetCredentialsForContractRequest | 

    try:
        # Get credentials issued via a contract
        api_response = api_instance.contracts_get_credentials_for_contract(contracts_get_credentials_for_contract_request)
        print("The response of ContractsApi->contracts_get_credentials_for_contract:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_get_credentials_for_contract: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_get_credentials_for_contract_request** | [**ContractsGetCredentialsForContractRequest**](ContractsGetCredentialsForContractRequest.md)|  | 

### Return type

[**ContractsGetCredentialsForContract200Response**](ContractsGetCredentialsForContract200Response.md)

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

# **contracts_get_request_status_for_profile**
> ContractsGetRequestStatusForProfile200Response contracts_get_request_status_for_profile(target_profile_id, contract_id=contract_id, contract_uri=contract_uri)

Get request status for a specific profile under a contract

Returns the request status and read status for a given profile in a specific contract.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_get_request_status_for_profile200_response import ContractsGetRequestStatusForProfile200Response
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
    api_instance = openapi_client.ContractsApi(api_client)
    target_profile_id = 'target_profile_id_example' # str | 
    contract_id = 'contract_id_example' # str |  (optional)
    contract_uri = 'contract_uri_example' # str |  (optional)

    try:
        # Get request status for a specific profile under a contract
        api_response = api_instance.contracts_get_request_status_for_profile(target_profile_id, contract_id=contract_id, contract_uri=contract_uri)
        print("The response of ContractsApi->contracts_get_request_status_for_profile:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_get_request_status_for_profile: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **target_profile_id** | **str**|  | 
 **contract_id** | **str**|  | [optional] 
 **contract_uri** | **str**|  | [optional] 

### Return type

[**ContractsGetRequestStatusForProfile200Response**](ContractsGetRequestStatusForProfile200Response.md)

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

# **contracts_get_terms_transaction_history**
> ContractsGetTermsTransactionHistory200Response contracts_get_terms_transaction_history(contracts_get_terms_transaction_history_request)

Gets Transaction History

Gets the transaction history for a set of Consent Flow Contract Terms

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_get_terms_transaction_history200_response import ContractsGetTermsTransactionHistory200Response
from openapi_client.models.contracts_get_terms_transaction_history_request import ContractsGetTermsTransactionHistoryRequest
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
    api_instance = openapi_client.ContractsApi(api_client)
    contracts_get_terms_transaction_history_request = openapi_client.ContractsGetTermsTransactionHistoryRequest() # ContractsGetTermsTransactionHistoryRequest | 

    try:
        # Gets Transaction History
        api_response = api_instance.contracts_get_terms_transaction_history(contracts_get_terms_transaction_history_request)
        print("The response of ContractsApi->contracts_get_terms_transaction_history:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_get_terms_transaction_history: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_get_terms_transaction_history_request** | [**ContractsGetTermsTransactionHistoryRequest**](ContractsGetTermsTransactionHistoryRequest.md)|  | 

### Return type

[**ContractsGetTermsTransactionHistory200Response**](ContractsGetTermsTransactionHistory200Response.md)

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

# **contracts_mark_contract_request_as_seen**
> bool contracts_mark_contract_request_as_seen(contracts_mark_contract_request_as_seen_request)

Marks a contract request as seen

Updates the read status of a contract request to "seen" for the specified target profile. Only contract writers are authorized to perform this action.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_mark_contract_request_as_seen_request import ContractsMarkContractRequestAsSeenRequest
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
    api_instance = openapi_client.ContractsApi(api_client)
    contracts_mark_contract_request_as_seen_request = openapi_client.ContractsMarkContractRequestAsSeenRequest() # ContractsMarkContractRequestAsSeenRequest | 

    try:
        # Marks a contract request as seen
        api_response = api_instance.contracts_mark_contract_request_as_seen(contracts_mark_contract_request_as_seen_request)
        print("The response of ContractsApi->contracts_mark_contract_request_as_seen:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_mark_contract_request_as_seen: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_mark_contract_request_as_seen_request** | [**ContractsMarkContractRequestAsSeenRequest**](ContractsMarkContractRequestAsSeenRequest.md)|  | 

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

# **contracts_remove_auto_boosts_from_contract**
> bool contracts_remove_auto_boosts_from_contract(contracts_remove_auto_boosts_from_contract_request)

Remove autoboosts from a contract

Removes one or more autoboosts from an existing consent flow contract, identified by their boost URIs. The caller must be the contract owner or a designated writer.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_remove_auto_boosts_from_contract_request import ContractsRemoveAutoBoostsFromContractRequest
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
    api_instance = openapi_client.ContractsApi(api_client)
    contracts_remove_auto_boosts_from_contract_request = openapi_client.ContractsRemoveAutoBoostsFromContractRequest() # ContractsRemoveAutoBoostsFromContractRequest | 

    try:
        # Remove autoboosts from a contract
        api_response = api_instance.contracts_remove_auto_boosts_from_contract(contracts_remove_auto_boosts_from_contract_request)
        print("The response of ContractsApi->contracts_remove_auto_boosts_from_contract:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_remove_auto_boosts_from_contract: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_remove_auto_boosts_from_contract_request** | [**ContractsRemoveAutoBoostsFromContractRequest**](ContractsRemoveAutoBoostsFromContractRequest.md)|  | 

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

# **contracts_send_ai_insight_share_request**
> bool contracts_send_ai_insight_share_request(contracts_send_ai_insight_share_request_request)

AI Insights, consent flow share-notifcation request

Sends the targeted user an AI insights share notification

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_send_ai_insight_share_request_request import ContractsSendAiInsightShareRequestRequest
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
    api_instance = openapi_client.ContractsApi(api_client)
    contracts_send_ai_insight_share_request_request = openapi_client.ContractsSendAiInsightShareRequestRequest() # ContractsSendAiInsightShareRequestRequest | 

    try:
        # AI Insights, consent flow share-notifcation request
        api_response = api_instance.contracts_send_ai_insight_share_request(contracts_send_ai_insight_share_request_request)
        print("The response of ContractsApi->contracts_send_ai_insight_share_request:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_send_ai_insight_share_request: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_send_ai_insight_share_request_request** | [**ContractsSendAiInsightShareRequestRequest**](ContractsSendAiInsightShareRequestRequest.md)|  | 

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

# **contracts_send_ai_insights_contract_request**
> bool contracts_send_ai_insights_contract_request(contracts_send_ai_insights_contract_request_request)

AI Insights, consent flow notifcation request

Sends the targeted user an AI insights consent flow request via a notification

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_send_ai_insights_contract_request_request import ContractsSendAiInsightsContractRequestRequest
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
    api_instance = openapi_client.ContractsApi(api_client)
    contracts_send_ai_insights_contract_request_request = openapi_client.ContractsSendAiInsightsContractRequestRequest() # ContractsSendAiInsightsContractRequestRequest | 

    try:
        # AI Insights, consent flow notifcation request
        api_response = api_instance.contracts_send_ai_insights_contract_request(contracts_send_ai_insights_contract_request_request)
        print("The response of ContractsApi->contracts_send_ai_insights_contract_request:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_send_ai_insights_contract_request: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_send_ai_insights_contract_request_request** | [**ContractsSendAiInsightsContractRequestRequest**](ContractsSendAiInsightsContractRequestRequest.md)|  | 

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

# **contracts_sync_credentials_to_contract**
> bool contracts_sync_credentials_to_contract(contracts_sync_credentials_to_contract_request)

Sync credentials to a contract

Syncs credentials to a contract that the profile has consented to

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_sync_credentials_to_contract_request import ContractsSyncCredentialsToContractRequest
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
    api_instance = openapi_client.ContractsApi(api_client)
    contracts_sync_credentials_to_contract_request = openapi_client.ContractsSyncCredentialsToContractRequest() # ContractsSyncCredentialsToContractRequest | 

    try:
        # Sync credentials to a contract
        api_response = api_instance.contracts_sync_credentials_to_contract(contracts_sync_credentials_to_contract_request)
        print("The response of ContractsApi->contracts_sync_credentials_to_contract:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_sync_credentials_to_contract: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_sync_credentials_to_contract_request** | [**ContractsSyncCredentialsToContractRequest**](ContractsSyncCredentialsToContractRequest.md)|  | 

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

# **contracts_update_consented_contract_terms**
> bool contracts_update_consented_contract_terms(contracts_update_consented_contract_terms_request)

Updates Contract Terms

Updates the terms for a consented contract

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_update_consented_contract_terms_request import ContractsUpdateConsentedContractTermsRequest
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
    api_instance = openapi_client.ContractsApi(api_client)
    contracts_update_consented_contract_terms_request = openapi_client.ContractsUpdateConsentedContractTermsRequest() # ContractsUpdateConsentedContractTermsRequest | 

    try:
        # Updates Contract Terms
        api_response = api_instance.contracts_update_consented_contract_terms(contracts_update_consented_contract_terms_request)
        print("The response of ContractsApi->contracts_update_consented_contract_terms:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_update_consented_contract_terms: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_update_consented_contract_terms_request** | [**ContractsUpdateConsentedContractTermsRequest**](ContractsUpdateConsentedContractTermsRequest.md)|  | 

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

# **contracts_verify_consent**
> bool contracts_verify_consent(uri, profile_id)

Verifies that a profile has consented to a contract

Checks if a profile has consented to the specified contract

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
    api_instance = openapi_client.ContractsApi(api_client)
    uri = 'uri_example' # str | 
    profile_id = 'profile_id_example' # str | 

    try:
        # Verifies that a profile has consented to a contract
        api_response = api_instance.contracts_verify_consent(uri, profile_id)
        print("The response of ContractsApi->contracts_verify_consent:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_verify_consent: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **uri** | **str**|  | 
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
**404** | Not found |  -  |
**500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **contracts_withdraw_consent**
> bool contracts_withdraw_consent(uri)

Deletes Contract Terms

Withdraws consent by deleting Contract Terms

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
    api_instance = openapi_client.ContractsApi(api_client)
    uri = 'uri_example' # str | 

    try:
        # Deletes Contract Terms
        api_response = api_instance.contracts_withdraw_consent(uri)
        print("The response of ContractsApi->contracts_withdraw_consent:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_withdraw_consent: %s\n" % e)
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

# **contracts_write_credential_to_contract**
> str contracts_write_credential_to_contract(contracts_write_credential_to_contract_request)

Writes a boost credential to a did that has consented to a contract

Writes a boost credential to a did that has consented to a contract

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_write_credential_to_contract_request import ContractsWriteCredentialToContractRequest
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
    api_instance = openapi_client.ContractsApi(api_client)
    contracts_write_credential_to_contract_request = openapi_client.ContractsWriteCredentialToContractRequest() # ContractsWriteCredentialToContractRequest | 

    try:
        # Writes a boost credential to a did that has consented to a contract
        api_response = api_instance.contracts_write_credential_to_contract(contracts_write_credential_to_contract_request)
        print("The response of ContractsApi->contracts_write_credential_to_contract:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_write_credential_to_contract: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_write_credential_to_contract_request** | [**ContractsWriteCredentialToContractRequest**](ContractsWriteCredentialToContractRequest.md)|  | 

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

# **contracts_write_credential_to_contract_via_signing_authority**
> str contracts_write_credential_to_contract_via_signing_authority(contracts_write_credential_to_contract_via_signing_authority_request)

Write credential through signing authority for a DID consented to a contract

Issues and sends a boost credential via a registered signing authority to a DID that has consented to a contract.

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_write_credential_to_contract_via_signing_authority_request import ContractsWriteCredentialToContractViaSigningAuthorityRequest
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
    api_instance = openapi_client.ContractsApi(api_client)
    contracts_write_credential_to_contract_via_signing_authority_request = openapi_client.ContractsWriteCredentialToContractViaSigningAuthorityRequest() # ContractsWriteCredentialToContractViaSigningAuthorityRequest | 

    try:
        # Write credential through signing authority for a DID consented to a contract
        api_response = api_instance.contracts_write_credential_to_contract_via_signing_authority(contracts_write_credential_to_contract_via_signing_authority_request)
        print("The response of ContractsApi->contracts_write_credential_to_contract_via_signing_authority:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ContractsApi->contracts_write_credential_to_contract_via_signing_authority: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_write_credential_to_contract_via_signing_authority_request** | [**ContractsWriteCredentialToContractViaSigningAuthorityRequest**](ContractsWriteCredentialToContractViaSigningAuthorityRequest.md)|  | 

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

