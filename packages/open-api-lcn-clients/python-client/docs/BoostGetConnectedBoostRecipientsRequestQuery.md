# BoostGetConnectedBoostRecipientsRequestQuery


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**profile_id** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**display_name** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**short_bio** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**bio** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**email** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**website_link** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 
**is_service_profile** | **bool** |  | [optional] 
**type** | [**BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement**](BoostSearchSkillsAvailableForBoostRequestQueryAnyOfOrInnerStatement.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_get_connected_boost_recipients_request_query import BoostGetConnectedBoostRecipientsRequestQuery

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetConnectedBoostRecipientsRequestQuery from a JSON string
boost_get_connected_boost_recipients_request_query_instance = BoostGetConnectedBoostRecipientsRequestQuery.from_json(json)
# print the JSON string representation of the object
print(BoostGetConnectedBoostRecipientsRequestQuery.to_json())

# convert the object into a dict
boost_get_connected_boost_recipients_request_query_dict = boost_get_connected_boost_recipients_request_query_instance.to_dict()
# create an instance of BoostGetConnectedBoostRecipientsRequestQuery from a dict
boost_get_connected_boost_recipients_request_query_from_dict = BoostGetConnectedBoostRecipientsRequestQuery.from_dict(boost_get_connected_boost_recipients_request_query_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


