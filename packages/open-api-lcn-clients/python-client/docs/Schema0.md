# Schema0


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | [optional] 
**statement** | **str** |  | 
**description** | **str** |  | [optional] 
**code** | **str** |  | [optional] 
**icon** | **str** |  | [optional] 
**type** | **str** |  | [optional] 
**status** | **str** |  | [optional] 
**children** | [**List[Schema0]**](Schema0.md) |  | [optional] 

## Example

```python
from openapi_client.models.schema0 import Schema0

# TODO update the JSON string below
json = "{}"
# create an instance of Schema0 from a JSON string
schema0_instance = Schema0.from_json(json)
# print the JSON string representation of the object
print(Schema0.to_json())

# convert the object into a dict
schema0_dict = schema0_instance.to_dict()
# create an instance of Schema0 from a dict
schema0_from_dict = Schema0.from_dict(schema0_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


