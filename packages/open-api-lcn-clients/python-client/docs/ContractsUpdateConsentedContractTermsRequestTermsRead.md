# ContractsUpdateConsentedContractTermsRequestTermsRead


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**anonymize** | **bool** |  | [optional] 
**credentials** | [**ContractsUpdateConsentedContractTermsRequestTermsReadCredentials**](ContractsUpdateConsentedContractTermsRequestTermsReadCredentials.md) |  | [optional] 
**personal** | **Dict[str, str]** |  | [optional] 

## Example

```python
from openapi_client.models.contracts_update_consented_contract_terms_request_terms_read import ContractsUpdateConsentedContractTermsRequestTermsRead

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsUpdateConsentedContractTermsRequestTermsRead from a JSON string
contracts_update_consented_contract_terms_request_terms_read_instance = ContractsUpdateConsentedContractTermsRequestTermsRead.from_json(json)
# print the JSON string representation of the object
print(ContractsUpdateConsentedContractTermsRequestTermsRead.to_json())

# convert the object into a dict
contracts_update_consented_contract_terms_request_terms_read_dict = contracts_update_consented_contract_terms_request_terms_read_instance.to_dict()
# create an instance of ContractsUpdateConsentedContractTermsRequestTermsRead from a dict
contracts_update_consented_contract_terms_request_terms_read_from_dict = ContractsUpdateConsentedContractTermsRequestTermsRead.from_dict(contracts_update_consented_contract_terms_request_terms_read_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


