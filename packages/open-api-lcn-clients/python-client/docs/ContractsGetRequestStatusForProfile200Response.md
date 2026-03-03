# ContractsGetRequestStatusForProfile200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**profile** | [**BoostGetPaginatedBoostRecipients200ResponseRecordsInnerTo**](BoostGetPaginatedBoostRecipients200ResponseRecordsInnerTo.md) |  | 
**status** | **str** |  | 
**read_status** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.contracts_get_request_status_for_profile200_response import ContractsGetRequestStatusForProfile200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetRequestStatusForProfile200Response from a JSON string
contracts_get_request_status_for_profile200_response_instance = ContractsGetRequestStatusForProfile200Response.from_json(json)
# print the JSON string representation of the object
print(ContractsGetRequestStatusForProfile200Response.to_json())

# convert the object into a dict
contracts_get_request_status_for_profile200_response_dict = contracts_get_request_status_for_profile200_response_instance.to_dict()
# create an instance of ContractsGetRequestStatusForProfile200Response from a dict
contracts_get_request_status_for_profile200_response_from_dict = ContractsGetRequestStatusForProfile200Response.from_dict(contracts_get_request_status_for_profile200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


