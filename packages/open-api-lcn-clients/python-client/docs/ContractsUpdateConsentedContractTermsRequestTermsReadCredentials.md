# ContractsUpdateConsentedContractTermsRequestTermsReadCredentials


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**share_all** | **bool** |  | [optional] 
**sharing** | **bool** |  | [optional] 
**categories** | [**Dict[str, ContractsGetConsentedContractsRequestQueryReadCredentialsCategoriesValue]**](ContractsGetConsentedContractsRequestQueryReadCredentialsCategoriesValue.md) |  | [optional] 

## Example

```python
from openapi_client.models.contracts_update_consented_contract_terms_request_terms_read_credentials import ContractsUpdateConsentedContractTermsRequestTermsReadCredentials

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsUpdateConsentedContractTermsRequestTermsReadCredentials from a JSON string
contracts_update_consented_contract_terms_request_terms_read_credentials_instance = ContractsUpdateConsentedContractTermsRequestTermsReadCredentials.from_json(json)
# print the JSON string representation of the object
print(ContractsUpdateConsentedContractTermsRequestTermsReadCredentials.to_json())

# convert the object into a dict
contracts_update_consented_contract_terms_request_terms_read_credentials_dict = contracts_update_consented_contract_terms_request_terms_read_credentials_instance.to_dict()
# create an instance of ContractsUpdateConsentedContractTermsRequestTermsReadCredentials from a dict
contracts_update_consented_contract_terms_request_terms_read_credentials_from_dict = ContractsUpdateConsentedContractTermsRequestTermsReadCredentials.from_dict(contracts_update_consented_contract_terms_request_terms_read_credentials_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


