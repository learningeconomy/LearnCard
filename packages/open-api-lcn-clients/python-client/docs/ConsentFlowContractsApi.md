# openapi_client.ConsentFlowContractsApi

All URIs are relative to *https://network.learncard.com/api*

Method | HTTP request | Description
------------- | ------------- | -------------
[**contracts_consent_to_contract**](ConsentFlowContractsApi.md#contracts_consent_to_contract) | **POST** /consent-flow-contract/consent | Consent To Contract
[**contracts_create_consent_flow_contract**](ConsentFlowContractsApi.md#contracts_create_consent_flow_contract) | **POST** /consent-flow-contract | Create Consent Flow Contract
[**contracts_delete_consent_flow_contract**](ConsentFlowContractsApi.md#contracts_delete_consent_flow_contract) | **DELETE** /consent-flow-contract | Delete a Consent Flow Contract
[**contracts_get_all_credentials_for_terms**](ConsentFlowContractsApi.md#contracts_get_all_credentials_for_terms) | **POST** /consent-flow-contracts/credentials | Get all credentials written to any terms
[**contracts_get_consent_flow_contract**](ConsentFlowContractsApi.md#contracts_get_consent_flow_contract) | **GET** /consent-flow-contract | Get Consent Flow Contracts
[**contracts_get_consent_flow_contracts**](ConsentFlowContractsApi.md#contracts_get_consent_flow_contracts) | **POST** /consent-flow-contracts | Get Consent Flow Contracts
[**contracts_get_consented_contracts**](ConsentFlowContractsApi.md#contracts_get_consented_contracts) | **POST** /consent-flow-contracts/consent | Gets Consented Contracts
[**contracts_get_consented_data**](ConsentFlowContractsApi.md#contracts_get_consented_data) | **POST** /consent-flow-contract/data | Get the data that has been consented for all of your contracts
[**contracts_get_consented_data_for_contract**](ConsentFlowContractsApi.md#contracts_get_consented_data_for_contract) | **POST** /consent-flow-contract/data-for-contract | Get the data that has been consented for a contract
[**contracts_get_consented_data_for_did**](ConsentFlowContractsApi.md#contracts_get_consented_data_for_did) | **POST** /consent-flow-contract/data-for-did | Get the data that has been consented by a did
[**contracts_get_credentials_for_contract**](ConsentFlowContractsApi.md#contracts_get_credentials_for_contract) | **POST** /consent-flow-contract/credentials | Get credentials issued via a contract
[**contracts_get_terms_transaction_history**](ConsentFlowContractsApi.md#contracts_get_terms_transaction_history) | **POST** /consent-flow-contract/consent/history | Gets Transaction History
[**contracts_sync_credentials_to_contract**](ConsentFlowContractsApi.md#contracts_sync_credentials_to_contract) | **POST** /consent-flow-contract/sync | Sync credentials to a contract
[**contracts_update_consented_contract_terms**](ConsentFlowContractsApi.md#contracts_update_consented_contract_terms) | **POST** /consent-flow-contract/consent/update | Updates Contract Terms
[**contracts_verify_consent**](ConsentFlowContractsApi.md#contracts_verify_consent) | **GET** /consent-flow-contract/verify | Verifies that a profile has consented to a contract
[**contracts_withdraw_consent**](ConsentFlowContractsApi.md#contracts_withdraw_consent) | **DELETE** /consent-flow-contract/consent/withdraw | Deletes Contract Terms
[**contracts_write_credential_to_contract**](ConsentFlowContractsApi.md#contracts_write_credential_to_contract) | **POST** /consent-flow-contract/write | Writes a boost credential to a did that has consented to a contract
[**contracts_write_credential_to_contract_via_signing_authority**](ConsentFlowContractsApi.md#contracts_write_credential_to_contract_via_signing_authority) | **POST** /consent-flow-contract/write/via-signing-authority | Write credential through signing authority for a DID consented to a contract


# **contracts_consent_to_contract**
> str contracts_consent_to_contract(contracts_consent_to_contract_request)

Consent To Contract

Consents to a Contract with a hard set of terms

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
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
    api_instance = openapi_client.ConsentFlowContractsApi(api_client)
    contracts_consent_to_contract_request = openapi_client.ContractsConsentToContractRequest() # ContractsConsentToContractRequest | 

    try:
        # Consent To Contract
        api_response = api_instance.contracts_consent_to_contract(contracts_consent_to_contract_request)
        print("The response of ConsentFlowContractsApi->contracts_consent_to_contract:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ConsentFlowContractsApi->contracts_consent_to_contract: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_consent_to_contract_request** | [**ContractsConsentToContractRequest**](ContractsConsentToContractRequest.md)|  | 

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
    api_instance = openapi_client.ConsentFlowContractsApi(api_client)
    contracts_create_consent_flow_contract_request = openapi_client.ContractsCreateConsentFlowContractRequest() # ContractsCreateConsentFlowContractRequest | 

    try:
        # Create Consent Flow Contract
        api_response = api_instance.contracts_create_consent_flow_contract(contracts_create_consent_flow_contract_request)
        print("The response of ConsentFlowContractsApi->contracts_create_consent_flow_contract:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ConsentFlowContractsApi->contracts_create_consent_flow_contract: %s\n" % e)
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
**0** | Error response |  -  |

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
    api_instance = openapi_client.ConsentFlowContractsApi(api_client)
    uri = 'uri_example' # str | 

    try:
        # Delete a Consent Flow Contract
        api_response = api_instance.contracts_delete_consent_flow_contract(uri)
        print("The response of ConsentFlowContractsApi->contracts_delete_consent_flow_contract:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ConsentFlowContractsApi->contracts_delete_consent_flow_contract: %s\n" % e)
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
    api_instance = openapi_client.ConsentFlowContractsApi(api_client)
    contracts_get_all_credentials_for_terms_request = openapi_client.ContractsGetAllCredentialsForTermsRequest() # ContractsGetAllCredentialsForTermsRequest |  (optional)

    try:
        # Get all credentials written to any terms
        api_response = api_instance.contracts_get_all_credentials_for_terms(contracts_get_all_credentials_for_terms_request=contracts_get_all_credentials_for_terms_request)
        print("The response of ConsentFlowContractsApi->contracts_get_all_credentials_for_terms:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ConsentFlowContractsApi->contracts_get_all_credentials_for_terms: %s\n" % e)
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
**0** | Error response |  -  |

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
    api_instance = openapi_client.ConsentFlowContractsApi(api_client)
    uri = 'uri_example' # str | 

    try:
        # Get Consent Flow Contracts
        api_response = api_instance.contracts_get_consent_flow_contract(uri)
        print("The response of ConsentFlowContractsApi->contracts_get_consent_flow_contract:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ConsentFlowContractsApi->contracts_get_consent_flow_contract: %s\n" % e)
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
**0** | Error response |  -  |

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
    api_instance = openapi_client.ConsentFlowContractsApi(api_client)
    contracts_get_consent_flow_contracts_request = openapi_client.ContractsGetConsentFlowContractsRequest() # ContractsGetConsentFlowContractsRequest |  (optional)

    try:
        # Get Consent Flow Contracts
        api_response = api_instance.contracts_get_consent_flow_contracts(contracts_get_consent_flow_contracts_request=contracts_get_consent_flow_contracts_request)
        print("The response of ConsentFlowContractsApi->contracts_get_consent_flow_contracts:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ConsentFlowContractsApi->contracts_get_consent_flow_contracts: %s\n" % e)
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
**0** | Error response |  -  |

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
    api_instance = openapi_client.ConsentFlowContractsApi(api_client)
    contracts_get_consented_contracts_request = openapi_client.ContractsGetConsentedContractsRequest() # ContractsGetConsentedContractsRequest |  (optional)

    try:
        # Gets Consented Contracts
        api_response = api_instance.contracts_get_consented_contracts(contracts_get_consented_contracts_request=contracts_get_consented_contracts_request)
        print("The response of ConsentFlowContractsApi->contracts_get_consented_contracts:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ConsentFlowContractsApi->contracts_get_consented_contracts: %s\n" % e)
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
**0** | Error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **contracts_get_consented_data**
> ContractsGetConsentedDataForContract200Response contracts_get_consented_data(contracts_get_consented_data_request=contracts_get_consented_data_request)

Get the data that has been consented for all of your contracts

This route grabs all the data that has been consented for all of your contracts

### Example

* Bearer Authentication (Authorization):

```python
import openapi_client
from openapi_client.models.contracts_get_consented_data_for_contract200_response import ContractsGetConsentedDataForContract200Response
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
    api_instance = openapi_client.ConsentFlowContractsApi(api_client)
    contracts_get_consented_data_request = openapi_client.ContractsGetConsentedDataRequest() # ContractsGetConsentedDataRequest |  (optional)

    try:
        # Get the data that has been consented for all of your contracts
        api_response = api_instance.contracts_get_consented_data(contracts_get_consented_data_request=contracts_get_consented_data_request)
        print("The response of ConsentFlowContractsApi->contracts_get_consented_data:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ConsentFlowContractsApi->contracts_get_consented_data: %s\n" % e)
```



### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **contracts_get_consented_data_request** | [**ContractsGetConsentedDataRequest**](ContractsGetConsentedDataRequest.md)|  | [optional] 

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
**0** | Error response |  -  |

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
    api_instance = openapi_client.ConsentFlowContractsApi(api_client)
    contracts_get_consented_data_for_contract_request = openapi_client.ContractsGetConsentedDataForContractRequest() # ContractsGetConsentedDataForContractRequest | 

    try:
        # Get the data that has been consented for a contract
        api_response = api_instance.contracts_get_consented_data_for_contract(contracts_get_consented_data_for_contract_request)
        print("The response of ConsentFlowContractsApi->contracts_get_consented_data_for_contract:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ConsentFlowContractsApi->contracts_get_consented_data_for_contract: %s\n" % e)
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
**0** | Error response |  -  |

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
    api_instance = openapi_client.ConsentFlowContractsApi(api_client)
    contracts_get_consented_data_for_did_request = openapi_client.ContractsGetConsentedDataForDidRequest() # ContractsGetConsentedDataForDidRequest | 

    try:
        # Get the data that has been consented by a did
        api_response = api_instance.contracts_get_consented_data_for_did(contracts_get_consented_data_for_did_request)
        print("The response of ConsentFlowContractsApi->contracts_get_consented_data_for_did:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ConsentFlowContractsApi->contracts_get_consented_data_for_did: %s\n" % e)
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
**0** | Error response |  -  |

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
    api_instance = openapi_client.ConsentFlowContractsApi(api_client)
    contracts_get_credentials_for_contract_request = openapi_client.ContractsGetCredentialsForContractRequest() # ContractsGetCredentialsForContractRequest | 

    try:
        # Get credentials issued via a contract
        api_response = api_instance.contracts_get_credentials_for_contract(contracts_get_credentials_for_contract_request)
        print("The response of ConsentFlowContractsApi->contracts_get_credentials_for_contract:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ConsentFlowContractsApi->contracts_get_credentials_for_contract: %s\n" % e)
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
**0** | Error response |  -  |

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
    api_instance = openapi_client.ConsentFlowContractsApi(api_client)
    contracts_get_terms_transaction_history_request = openapi_client.ContractsGetTermsTransactionHistoryRequest() # ContractsGetTermsTransactionHistoryRequest | 

    try:
        # Gets Transaction History
        api_response = api_instance.contracts_get_terms_transaction_history(contracts_get_terms_transaction_history_request)
        print("The response of ConsentFlowContractsApi->contracts_get_terms_transaction_history:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ConsentFlowContractsApi->contracts_get_terms_transaction_history: %s\n" % e)
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
**0** | Error response |  -  |

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
    api_instance = openapi_client.ConsentFlowContractsApi(api_client)
    contracts_sync_credentials_to_contract_request = openapi_client.ContractsSyncCredentialsToContractRequest() # ContractsSyncCredentialsToContractRequest | 

    try:
        # Sync credentials to a contract
        api_response = api_instance.contracts_sync_credentials_to_contract(contracts_sync_credentials_to_contract_request)
        print("The response of ConsentFlowContractsApi->contracts_sync_credentials_to_contract:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ConsentFlowContractsApi->contracts_sync_credentials_to_contract: %s\n" % e)
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
**0** | Error response |  -  |

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
    api_instance = openapi_client.ConsentFlowContractsApi(api_client)
    contracts_update_consented_contract_terms_request = openapi_client.ContractsUpdateConsentedContractTermsRequest() # ContractsUpdateConsentedContractTermsRequest | 

    try:
        # Updates Contract Terms
        api_response = api_instance.contracts_update_consented_contract_terms(contracts_update_consented_contract_terms_request)
        print("The response of ConsentFlowContractsApi->contracts_update_consented_contract_terms:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ConsentFlowContractsApi->contracts_update_consented_contract_terms: %s\n" % e)
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
**0** | Error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **contracts_verify_consent**
> bool contracts_verify_consent(uri, profile_id)

Verifies that a profile has consented to a contract

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
    api_instance = openapi_client.ConsentFlowContractsApi(api_client)
    uri = 'uri_example' # str | 
    profile_id = 'profile_id_example' # str | 

    try:
        # Verifies that a profile has consented to a contract
        api_response = api_instance.contracts_verify_consent(uri, profile_id)
        print("The response of ConsentFlowContractsApi->contracts_verify_consent:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ConsentFlowContractsApi->contracts_verify_consent: %s\n" % e)
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
**0** | Error response |  -  |

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
    api_instance = openapi_client.ConsentFlowContractsApi(api_client)
    uri = 'uri_example' # str | 

    try:
        # Deletes Contract Terms
        api_response = api_instance.contracts_withdraw_consent(uri)
        print("The response of ConsentFlowContractsApi->contracts_withdraw_consent:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ConsentFlowContractsApi->contracts_withdraw_consent: %s\n" % e)
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
    api_instance = openapi_client.ConsentFlowContractsApi(api_client)
    contracts_write_credential_to_contract_request = openapi_client.ContractsWriteCredentialToContractRequest() # ContractsWriteCredentialToContractRequest | 

    try:
        # Writes a boost credential to a did that has consented to a contract
        api_response = api_instance.contracts_write_credential_to_contract(contracts_write_credential_to_contract_request)
        print("The response of ConsentFlowContractsApi->contracts_write_credential_to_contract:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ConsentFlowContractsApi->contracts_write_credential_to_contract: %s\n" % e)
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
**0** | Error response |  -  |

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
    api_instance = openapi_client.ConsentFlowContractsApi(api_client)
    contracts_write_credential_to_contract_via_signing_authority_request = openapi_client.ContractsWriteCredentialToContractViaSigningAuthorityRequest() # ContractsWriteCredentialToContractViaSigningAuthorityRequest | 

    try:
        # Write credential through signing authority for a DID consented to a contract
        api_response = api_instance.contracts_write_credential_to_contract_via_signing_authority(contracts_write_credential_to_contract_via_signing_authority_request)
        print("The response of ConsentFlowContractsApi->contracts_write_credential_to_contract_via_signing_authority:\n")
        pprint(api_response)
    except Exception as e:
        print("Exception when calling ConsentFlowContractsApi->contracts_write_credential_to_contract_via_signing_authority: %s\n" % e)
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
**0** | Error response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

