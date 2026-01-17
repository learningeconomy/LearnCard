# BoostAlignBoostSkillsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**boost_uri** | **str** |  | 
**skills** | [**List[BoostAlignBoostSkillsRequestSkillsInner]**](BoostAlignBoostSkillsRequestSkillsInner.md) |  | 

## Example

```python
from openapi_client.models.boost_align_boost_skills_request import BoostAlignBoostSkillsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostAlignBoostSkillsRequest from a JSON string
boost_align_boost_skills_request_instance = BoostAlignBoostSkillsRequest.from_json(json)
# print the JSON string representation of the object
print(BoostAlignBoostSkillsRequest.to_json())

# convert the object into a dict
boost_align_boost_skills_request_dict = boost_align_boost_skills_request_instance.to_dict()
# create an instance of BoostAlignBoostSkillsRequest from a dict
boost_align_boost_skills_request_from_dict = BoostAlignBoostSkillsRequest.from_dict(boost_align_boost_skills_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


