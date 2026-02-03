# BoostGetBoostRecipientsWithChildrenCountRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**uri** | **str** |  | 
**include_unaccepted_boosts** | **bool** |  | [optional] [default to True]
**number_of_generations** | [**BoostGetBoostRecipientsWithChildrenCountRequestNumberOfGenerations**](BoostGetBoostRecipientsWithChildrenCountRequestNumberOfGenerations.md) |  | [optional] 
**boost_query** | [**BoostGetBoostsRequestQuery**](BoostGetBoostsRequestQuery.md) |  | [optional] 
**profile_query** | [**BoostGetPaginatedBoostRecipientsRequestQuery**](BoostGetPaginatedBoostRecipientsRequestQuery.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_get_boost_recipients_with_children_count_request import BoostGetBoostRecipientsWithChildrenCountRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetBoostRecipientsWithChildrenCountRequest from a JSON string
boost_get_boost_recipients_with_children_count_request_instance = BoostGetBoostRecipientsWithChildrenCountRequest.from_json(json)
# print the JSON string representation of the object
print(BoostGetBoostRecipientsWithChildrenCountRequest.to_json())

# convert the object into a dict
boost_get_boost_recipients_with_children_count_request_dict = boost_get_boost_recipients_with_children_count_request_instance.to_dict()
# create an instance of BoostGetBoostRecipientsWithChildrenCountRequest from a dict
boost_get_boost_recipients_with_children_count_request_from_dict = BoostGetBoostRecipientsWithChildrenCountRequest.from_dict(boost_get_boost_recipients_with_children_count_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


