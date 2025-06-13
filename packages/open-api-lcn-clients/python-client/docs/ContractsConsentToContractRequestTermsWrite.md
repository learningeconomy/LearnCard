# ContractsConsentToContractRequestTermsWrite


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**credentials** | [**ContractsConsentToContractRequestTermsWriteCredentials**](ContractsConsentToContractRequestTermsWriteCredentials.md) |  | [optional] 
**personal** | **Dict[str, bool]** |  | [optional] 

## Example

```python
from openapi_client.models.contracts_consent_to_contract_request_terms_write import ContractsConsentToContractRequestTermsWrite

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsConsentToContractRequestTermsWrite from a JSON string
contracts_consent_to_contract_request_terms_write_instance = ContractsConsentToContractRequestTermsWrite.from_json(json)
# print the JSON string representation of the object
print(ContractsConsentToContractRequestTermsWrite.to_json())

# convert the object into a dict
contracts_consent_to_contract_request_terms_write_dict = contracts_consent_to_contract_request_terms_write_instance.to_dict()
# create an instance of ContractsConsentToContractRequestTermsWrite from a dict
contracts_consent_to_contract_request_terms_write_from_dict = ContractsConsentToContractRequestTermsWrite.from_dict(contracts_consent_to_contract_request_terms_write_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


