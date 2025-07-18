# BoostGetConnectedBoostRecipientsRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**limit** | **float** |  | [optional] [default to 25]
**cursor** | **str** |  | [optional] 
**sort** | **str** |  | [optional] 
**include_unaccepted_boosts** | **bool** |  | [optional] [default to True]
**query** | [**BoostGetPaginatedBoostRecipientsRequestQuery**](BoostGetPaginatedBoostRecipientsRequestQuery.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_get_connected_boost_recipients_request import BoostGetConnectedBoostRecipientsRequest

# TODO update the JSON string below
json = "{}"
# create an instance of BoostGetConnectedBoostRecipientsRequest from a JSON string
boost_get_connected_boost_recipients_request_instance = BoostGetConnectedBoostRecipientsRequest.from_json(json)
# print the JSON string representation of the object
print(BoostGetConnectedBoostRecipientsRequest.to_json())

# convert the object into a dict
boost_get_connected_boost_recipients_request_dict = boost_get_connected_boost_recipients_request_instance.to_dict()
# create an instance of BoostGetConnectedBoostRecipientsRequest from a dict
boost_get_connected_boost_recipients_request_from_dict = BoostGetConnectedBoostRecipientsRequest.from_dict(boost_get_connected_boost_recipients_request_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


