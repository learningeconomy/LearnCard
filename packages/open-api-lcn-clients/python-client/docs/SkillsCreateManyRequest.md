# SkillsCreateManyRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**framework_id** | **str** |  | 
**skills** | [**List[Schema0]**](Schema0.md) |  | 
**parent_id** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.skills_create_many_request import SkillsCreateManyRequest

# TODO update the JSON string below
json = "{}"
# create an instance of SkillsCreateManyRequest from a JSON string
skills_create_many_request_instance = SkillsCreateManyRequest.from_json(json)
# print the JSON string representation of the object
print(SkillsCreateManyRequest.to_json())

# convert the object into a dict
skills_create_many_request_dict = skills_create_many_request_instance.to_dict()
# create an instance of SkillsCreateManyRequest from a dict
skills_create_many_request_from_dict = SkillsCreateManyRequest.from_dict(skills_create_many_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


