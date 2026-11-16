# ContractsUpdateConsentFlowContractRequest

## Properties

| Name                   | Type                                                                                                        | Description | Notes      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **uri**                | **str**                                                                                                     |             |
| **changes**            | [**ContractsUpdateConsentFlowContractRequestChanges**](ContractsUpdateConsentFlowContractRequestChanges.md) |             |
| **reason**             | **str**                                                                                                     |             | [optional] |
| **reconsent_deadline** | **datetime**                                                                                                |             | [optional] |
| **dry_run**            | **bool**                                                                                                    |             | [optional] |
| **expected_version**   | **int**                                                                                                     |             | [optional] |

## Example

```python
from openapi_client.models.contracts_update_consent_flow_contract_request import ContractsUpdateConsentFlowContractRequest

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsUpdateConsentFlowContractRequest from a JSON string
contracts_update_consent_flow_contract_request_instance = ContractsUpdateConsentFlowContractRequest.from_json(json)
# print the JSON string representation of the object
print(ContractsUpdateConsentFlowContractRequest.to_json())

# convert the object into a dict
contracts_update_consent_flow_contract_request_dict = contracts_update_consent_flow_contract_request_instance.to_dict()
# create an instance of ContractsUpdateConsentFlowContractRequest from a dict
contracts_update_consent_flow_contract_request_from_dict = ContractsUpdateConsentFlowContractRequest.from_dict(contracts_update_consent_flow_contract_request_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
