# BoostSearchSkillsAvailableForBoost200ResponseRecordsInner


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

## Example

```python
from openapi_client.models.boost_search_skills_available_for_boost200_response_records_inner import BoostSearchSkillsAvailableForBoost200ResponseRecordsInner

# TODO update the JSON string below
json = "{}"
# create an instance of BoostSearchSkillsAvailableForBoost200ResponseRecordsInner from a JSON string
boost_search_skills_available_for_boost200_response_records_inner_instance = BoostSearchSkillsAvailableForBoost200ResponseRecordsInner.from_json(json)
# print the JSON string representation of the object
print(BoostSearchSkillsAvailableForBoost200ResponseRecordsInner.to_json())

# convert the object into a dict
boost_search_skills_available_for_boost200_response_records_inner_dict = boost_search_skills_available_for_boost200_response_records_inner_instance.to_dict()
# create an instance of BoostSearchSkillsAvailableForBoost200ResponseRecordsInner from a dict
boost_search_skills_available_for_boost200_response_records_inner_from_dict = BoostSearchSkillsAvailableForBoost200ResponseRecordsInner.from_dict(boost_search_skills_available_for_boost200_response_records_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


