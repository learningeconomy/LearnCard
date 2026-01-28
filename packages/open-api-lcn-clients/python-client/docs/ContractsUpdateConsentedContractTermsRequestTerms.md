# ContractsUpdateConsentedContractTermsRequestTerms


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**read** | [**ContractsUpdateConsentedContractTermsRequestTermsRead**](ContractsUpdateConsentedContractTermsRequestTermsRead.md) |  | [optional] 
**write** | [**ContractsConsentToContractRequestTermsWrite**](ContractsConsentToContractRequestTermsWrite.md) |  | [optional] 
**denied_writers** | **List[str]** |  | [optional] 

## Example

```python
from openapi_client.models.contracts_update_consented_contract_terms_request_terms import ContractsUpdateConsentedContractTermsRequestTerms

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsUpdateConsentedContractTermsRequestTerms from a JSON string
contracts_update_consented_contract_terms_request_terms_instance = ContractsUpdateConsentedContractTermsRequestTerms.from_json(json)
# print the JSON string representation of the object
print(ContractsUpdateConsentedContractTermsRequestTerms.to_json())

# convert the object into a dict
contracts_update_consented_contract_terms_request_terms_dict = contracts_update_consented_contract_terms_request_terms_instance.to_dict()
# create an instance of ContractsUpdateConsentedContractTermsRequestTerms from a dict
contracts_update_consented_contract_terms_request_terms_from_dict = ContractsUpdateConsentedContractTermsRequestTerms.from_dict(contracts_update_consented_contract_terms_request_terms_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


