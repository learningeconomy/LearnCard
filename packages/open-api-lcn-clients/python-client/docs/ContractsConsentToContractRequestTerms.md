# ContractsConsentToContractRequestTerms


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**read** | [**ContractsConsentToContractRequestTermsRead**](ContractsConsentToContractRequestTermsRead.md) |  | [optional] 
**write** | [**ContractsConsentToContractRequestTermsWrite**](ContractsConsentToContractRequestTermsWrite.md) |  | [optional] 
**denied_writers** | **List[str]** |  | [optional] 

## Example

```python
from openapi_client.models.contracts_consent_to_contract_request_terms import ContractsConsentToContractRequestTerms

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsConsentToContractRequestTerms from a JSON string
contracts_consent_to_contract_request_terms_instance = ContractsConsentToContractRequestTerms.from_json(json)
# print the JSON string representation of the object
print(ContractsConsentToContractRequestTerms.to_json())

# convert the object into a dict
contracts_consent_to_contract_request_terms_dict = contracts_consent_to_contract_request_terms_instance.to_dict()
# create an instance of ContractsConsentToContractRequestTerms from a dict
contracts_consent_to_contract_request_terms_from_dict = ContractsConsentToContractRequestTerms.from_dict(contracts_consent_to_contract_request_terms_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


