# BoostGetBoostsRequestQueryAnyOfOrInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**uri** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**name** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**type** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**category** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**meta** | [**Dict[str, BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement]**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**status** | [**BoostGetBoostsRequestQueryAnyOfOrInnerStatus**](BoostGetBoostsRequestQueryAnyOfOrInnerStatus.md) |  | [optional] 
**auto_connect_recipients** | **bool** |  | [optional] 

## Example

```python
from openapi_client.models.boost_get_boosts_request_query_any_of_or_inner import BoostGetBoostsRequestQueryAnyOfOrInner

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetBoostsRequestQueryAnyOfOrInner from a JSON string
boost_get_boosts_request_query_any_of_or_inner_instance = BoostGetBoostsRequestQueryAnyOfOrInner.from_json(json)
# print the JSON string representation of the object
print(BoostGetBoostsRequestQueryAnyOfOrInner.to_json())

# convert the object into a dict
boost_get_boosts_request_query_any_of_or_inner_dict = boost_get_boosts_request_query_any_of_or_inner_instance.to_dict()
# create an instance of BoostGetBoostsRequestQueryAnyOfOrInner from a dict
boost_get_boosts_request_query_any_of_or_inner_from_dict = BoostGetBoostsRequestQueryAnyOfOrInner.from_dict(boost_get_boosts_request_query_any_of_or_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


