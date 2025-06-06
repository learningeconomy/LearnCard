# ContractsConsentToContractRequestTermsReadCredentials


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**share_all** | **bool** |  | [optional] 
**sharing** | **bool** |  | [optional] 
**categories** | [**Dict[str, StorageResolve200ResponseAnyOf1ReadCredentialsCategoriesValue]**](StorageResolve200ResponseAnyOf1ReadCredentialsCategoriesValue.md) |  | [optional] 

## Example

```python
from openapi_client.models.contracts_consent_to_contract_request_terms_read_credentials import ContractsConsentToContractRequestTermsReadCredentials

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsConsentToContractRequestTermsReadCredentials from a JSON string
contracts_consent_to_contract_request_terms_read_credentials_instance = ContractsConsentToContractRequestTermsReadCredentials.from_json(json)
# print the JSON string representation of the object
print(ContractsConsentToContractRequestTermsReadCredentials.to_json())

# convert the object into a dict
contracts_consent_to_contract_request_terms_read_credentials_dict = contracts_consent_to_contract_request_terms_read_credentials_instance.to_dict()
# create an instance of ContractsConsentToContractRequestTermsReadCredentials from a dict
contracts_consent_to_contract_request_terms_read_credentials_from_dict = ContractsConsentToContractRequestTermsReadCredentials.from_dict(contracts_consent_to_contract_request_terms_read_credentials_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


