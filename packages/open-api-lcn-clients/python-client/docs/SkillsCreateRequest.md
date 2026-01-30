# SkillsCreateRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**framework_id** | **str** |  | 
**skill** | [**Schema0**](Schema0.md) |  | 
**parent_id** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.skills_create_request import SkillsCreateRequest

# TODO update the JSON string below
json = "{}"
# create an instance of SkillsCreateRequest from a JSON string
skills_create_request_instance = SkillsCreateRequest.from_json(json)
# print the JSON string representation of the object
print(SkillsCreateRequest.to_json())

# convert the object into a dict
skills_create_request_dict = skills_create_request_instance.to_dict()
# create an instance of SkillsCreateRequest from a dict
skills_create_request_from_dict = SkillsCreateRequest.from_dict(skills_create_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


