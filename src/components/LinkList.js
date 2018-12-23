import React, { Component } from 'react';
import Link from './Link';

import { Query } from 'react-apollo';
import gql from 'graphql-tag';

const NEW_LINKS_SUBSCRIPTION = gql`
  subscription {
    newLink {
      id
      url
      description
      createdAt
      postedBy {
        id
        name
      }
      votes {
        id
        user {
          id
        }
      }
    }
  }
`;

export const FEED_QUERY = gql`
  {
    feed {
      links {
        id
        createdAt
        url
        description
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
    }
  }
`

class LinkList extends Component {
  _updateCacheAfterVote = (store, createVote, linkId) => {
    const data = store.readQuery({ query: FEED_QUERY }); // キャッシュからQuryでデータを取り出す
    const votedLink = data.feed.links.find(link => link.id === linkId); // キャッシュデータからvoteしたリンクのデータを取得する
    votedLink.votes = createVote.link.votes;  // Mutationの戻り値で取得したvotesデータで、キャッシュのvotesデータを上書きする
    store.writeQuery({ query: FEED_QUERY, data });
  };

  _subscribeToNewLinks = subscribeToMore => {
    subscribeToMore({
      document: NEW_LINKS_SUBSCRIPTION,  // sucscription will fire every time a New Link created
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const newLink = subscriptionData.data.newLink

        return Object.assign({}, prev, {
          feed: {
            links: [newLink, ...prev.feed.links],
            count: prev.feed.links.length + 1,
            __typename: prev.feed.__typename
          }
        })
      }
    })
  }

  render() {
    return (
      <Query query={FEED_QUERY}>
        {({ loading, error, data, subscribeToMore }) => {
          if (loading) return <div>Fetching...</div>
          if (error) return <div>Error</div>

          this._subscribeToNewLinks(subscribeToMore);

          const linksToRender = data.feed.links

          return (
            <div>
          {linksToRender.map((link, index) => (
            <Link
              key={link.id}
              link={link}
              index={index}
              updateStoreAfterVote={this._updateCacheAfterVote}
            />
          ))}
            </div>
          )
        }}
      </Query>
    )
  }
};

export default LinkList;