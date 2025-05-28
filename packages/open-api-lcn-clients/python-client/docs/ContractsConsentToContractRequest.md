# ContractsConsentToContractRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**terms** | [**StorageResolve200ResponseAnyOf1**](StorageResolve200ResponseAnyOf1.md) |  | 
**contract_uri** | **str** |  | 
**expires_at** | **str** |  | [optional] 
**one_time** | **bool** |  | [optional] 

## Example

```python
from openapi_client.models.contracts_consent_to_contract_request import ContractsConsentToContractRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsConsentToContractRequest from a JSON string
contracts_consent_to_contract_request_instance = ContractsConsentToContractRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsConsentToContractRequest.to_json())

# convert the object into a dict
contracts_consent_to_contract_request_dict = contracts_consent_to_contract_request_instance.to_dict()
# create an instance of ContractsConsentToContractRequest from a dict
contracts_consent_to_contract_request_from_dict = ContractsConsentToContractRequest.from_dict(contracts_consent_to_contract_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


