# ContractsGetConsentedData200Response


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**cursor** | **str** |  | [optional] 
**has_more** | **bool** |  | 
**records** | [**List[ContractsGetConsentedData200ResponseRecordsInner]**](ContractsGetConsentedData200ResponseRecordsInner.md) |  | 

## Example

```python
from openapi_client.models.contracts_get_consented_data200_response import ContractsGetConsentedData200Response

# TODO update the JSON string below
json = "{}"
# create an instance of ContractsGetConsentedData200Response from a JSON string
contracts_get_consented_data200_response_instance = ContractsGetConsentedData200Response.from_json(json)
# print the JSON string representation of the object
print(ContractsGetConsentedData200Response.to_json())

# convert the object into a dict
contracts_get_consented_data200_response_dict = contracts_get_consented_data200_response_instance.to_dict()
# create an instance of ContractsGetConsentedData200Response from a dict
contracts_get_consented_data200_response_from_dict = ContractsGetConsentedData200Response.from_dict(contracts_get_consented_data200_response_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


