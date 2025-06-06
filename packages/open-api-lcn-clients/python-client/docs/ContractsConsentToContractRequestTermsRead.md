# ContractsConsentToContractRequestTermsRead


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**anonymize** | **bool** |  | [optional] 
**credentials** | [**ContractsConsentToContractRequestTermsReadCredentials**](ContractsConsentToContractRequestTermsReadCredentials.md) |  | [optional] 
**personal** | **Dict[str, str]** |  | [optional] 

## Example

```python
from openapi_client.models.contracts_consent_to_contract_request_terms_read import ContractsConsentToContractRequestTermsRead

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsConsentToContractRequestTermsRead from a JSON string
contracts_consent_to_contract_request_terms_read_instance = ContractsConsentToContractRequestTermsRead.from_json(json)
# print the JSON string representation of the object
print(ContractsConsentToContractRequestTermsRead.to_json())

# convert the object into a dict
contracts_consent_to_contract_request_terms_read_dict = contracts_consent_to_contract_request_terms_read_instance.to_dict()
# create an instance of ContractsConsentToContractRequestTermsRead from a dict
contracts_consent_to_contract_request_terms_read_from_dict = ContractsConsentToContractRequestTermsRead.from_dict(contracts_consent_to_contract_request_terms_read_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


