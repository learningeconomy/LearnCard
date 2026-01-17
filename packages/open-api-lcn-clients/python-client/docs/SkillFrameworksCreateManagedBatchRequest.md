# SkillFrameworksCreateManagedBatchRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**frameworks** | [**List[SkillFrameworksCreateManagedBatchRequestFrameworksInner]**](SkillFrameworksCreateManagedBatchRequestFrameworksInner.md) |  | 

## Example

```python
from openapi_client.models.skill_frameworks_create_managed_batch_request import SkillFrameworksCreateManagedBatchRequest

# TODO update the JSON string below
json = "{}"
# create an instance of SkillFrameworksCreateManagedBatchRequest from a JSON string
skill_frameworks_create_managed_batch_request_instance = SkillFrameworksCreateManagedBatchRequest.from_json(json)
# print the JSON string representation of the object
print(SkillFrameworksCreateManagedBatchRequest.to_json())

# convert the object into a dict
skill_frameworks_create_managed_batch_request_dict = skill_frameworks_create_managed_batch_request_instance.to_dict()
# create an instance of SkillFrameworksCreateManagedBatchRequest from a dict
skill_frameworks_create_managed_batch_request_from_dict = SkillFrameworksCreateManagedBatchRequest.from_dict(skill_frameworks_create_managed_batch_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


