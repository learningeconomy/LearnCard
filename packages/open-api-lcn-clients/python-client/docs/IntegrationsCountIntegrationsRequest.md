# IntegrationsCountIntegrationsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**query** | [**IntegrationsGetIntegrationsRequestQuery**](IntegrationsGetIntegrationsRequestQuery.md) |  | [optional] 

## Example

```python
from openapi_client.models.integrations_count_integrations_request import IntegrationsCountIntegrationsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of IntegrationsCountIntegrationsRequest from a JSON string
integrations_count_integrations_request_instance = IntegrationsCountIntegrationsRequest.from_json(json)
# print the JSON string representation of the object
print(IntegrationsCountIntegrationsRequest.to_json())

# convert the object into a dict
integrations_count_integrations_request_dict = integrations_count_integrations_request_instance.to_dict()
# create an instance of IntegrationsCountIntegrationsRequest from a dict
integrations_count_integrations_request_from_dict = IntegrationsCountIntegrationsRequest.from_dict(integrations_count_integrations_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


