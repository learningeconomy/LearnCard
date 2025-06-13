# BoostGetBoostRecipients200ResponseInner


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**to** | [**BoostGetBoostRecipients200ResponseInnerTo**](BoostGetBoostRecipients200ResponseInnerTo.md) |  | 
**var_from** | **str** |  | 
**received** | **str** |  | [optional] 
**uri** | **str** |  | [optional] 

## Example

```python
from openapi_client.models.boost_get_boost_recipients200_response_inner import BoostGetBoostRecipients200ResponseInner

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetBoostRecipients200ResponseInner from a JSON string
boost_get_boost_recipients200_response_inner_instance = BoostGetBoostRecipients200ResponseInner.from_json(json)
# print the JSON string representation of the object
print(BoostGetBoostRecipients200ResponseInner.to_json())

# convert the object into a dict
boost_get_boost_recipients200_response_inner_dict = boost_get_boost_recipients200_response_inner_instance.to_dict()
# create an instance of BoostGetBoostRecipients200ResponseInner from a dict
boost_get_boost_recipients200_response_inner_from_dict = BoostGetBoostRecipients200ResponseInner.from_dict(boost_get_boost_recipients200_response_inner_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


