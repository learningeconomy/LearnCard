# Schema1


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **str** |  | 
**statement** | **str** |  | 
**description** | **str** |  | [optional] 
**code** | **str** |  | [optional] 
**icon** | **str** |  | [optional] 
**type** | **str** |  | [default to 'skill']
**status** | **str** |  | [default to 'active']
**framework_id** | **str** |  | [optional] 
**created_at** | **str** |  | [optional] 
**updated_at** | **str** |  | [optional] 
**children** | [**List[Schema1]**](Schema1.md) |  | 
**has_children** | **bool** |  | 
**children_cursor** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.schema1 import Schema1

# TODO update the JSON string below
json = "{}"
# create an instance of Schema1 from a JSON string
schema1_instance = Schema1.from_json(json)
# print the JSON string representation of the object
print(Schema1.to_json())

# convert the object into a dict
schema1_dict = schema1_instance.to_dict()
# create an instance of Schema1 from a dict
schema1_from_dict = Schema1.from_dict(schema1_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


