import 'regenerator-runtime/runtime'
import React from 'react'
import {
  Navbar,
  Container,
  Button,
  Row,
  Col,
  Card,
  Modal,
  Form,
  InputGroup,
  FormControl,
} from 'react-bootstrap'

import './global.css'
import logo from './assets/logo-white.svg'

import {
  login,
  logout,
  uid,
  convertToYoctoNear,
  convertToNear,
} from './utils'

const MyModal = function ({heading, body, footer, show, size}) {
  return (
    <>
      <Modal
        show={show}
        size={size}
        centered>
        <Modal.Header>
          <Modal.Title>{heading}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{body()}</Modal.Body>
        <Modal.Footer>
          {footer()}
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default function App() {
  const isSignedIn = window.walletConnection.isSignedIn()
  const [refreshData, setRefreshData] = React.useState(false)

  const [posts, setPosts] = React.useState({})
  const [totalPosts, setTotalPosts] = React.useState(0)
  const [totalDonations, setTotalDonations] = React.useState(0)

  const [showCreatePost, setShowCreatePost] = React.useState(false)
  const createPostClose = () => setShowCreatePost(false)
  const createPostShow = () => {
    if(!isSignedIn) return login()

    setShowCreatePost(true)
  }

  const donatePostId = React.useRef(false)
  const [donateAmount, setDonateAmount] = React.useState('1')
  const [showDonate, setShowDonate] = React.useState(false)
  const donateClose = () => setShowDonate(false)
  const donateShow = function (postId) {
    if(!isSignedIn) return login()

    donatePostId.current = postId
    setShowDonate(true)
  }

  const [imageLink, setImageLink] = React.useState('')
  const [companyName, setCompanyName] = React.useState('')
  const [companyAddress, setCompanyAddress] = React.useState('')
  const [yourQuote, setYourQuote] = React.useState('')

  const createPost = async () => {
    createPostClose()
    let message = {
      image_link: imageLink,
      company_name: companyName,
      company_address: companyAddress,
      your_quote: yourQuote,
      donation: 0,
      created_by: '',
    }
    try {
      await window.contract.create({
        id: uid(),
        message,
      })
    } catch (e) {
      alert(
        'Something went wrong! ' +
        'Maybe you need to sign out and back in? ' +
        'Check your browser console for more info.'
      )
      throw e
    }
    setRefreshData(prev => !prev)
  }

  const donate = async () => {
    donateClose()
    try {
      await window.contract.donate({
        post_id: donatePostId.current,
      }, 300000000000000, convertToYoctoNear(donateAmount))
    } catch (e) {
      alert(
        'Something went wrong! ' +
        'Maybe you need to sign out and back in? ' +
        'Check your browser console for more info.'
      )
      throw e
    }
  }

  React.useEffect(
    () => {
      window.contract.list({ account_id: window.accountId })
        .then(data => {
          setPosts(JSON.parse(data))
        })

      window.contract.get_total_posts()
        .then(data => {
          setTotalPosts(data)
        })

      window.contract.get_total_donations()
        .then(data => {
          setTotalDonations(data)
        })
    }, [refreshData]
  )

  return (
    <main>
      <Navbar bg="dark" variant="dark" className='sticky-top'>
        <Container>
          <Navbar.Brand href="">
            <img
              alt=""
              src={logo}
              width="50"
              height="50"
              className="d-inline-block align-middle" />
            <Navbar.Text className='align-middle me-3'>Total posts: {totalPosts}</Navbar.Text>
            <Navbar.Text className='align-middle'>Total donations: Ⓝ{convertToNear(totalDonations)}</Navbar.Text>
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Navbar.Text>
              {!isSignedIn &&
                <Button variant="light" onClick={login}>Login</Button>
              }

              {isSignedIn &&
                <>
                  Signed in as: <a>{window.accountId}</a>{' '}
                  <Button variant="light" onClick={logout}>Logout</Button>
                </>
              }
            </Navbar.Text>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div className='content-wrapper'>
        <Row>
        {Object.entries(posts).map((post, id) => {

          return (
            <Col className='col-md-3 mb-3' key={id}>
              <Card>
                <Card.Img variant="top" src={post[1].image_link} />
                <Card.Body>
                  <Card.Title>{post[1].company_name}</Card.Title>

                  <Card.Text>{post[1].company_address}</Card.Text>

                  <blockquote>{post[1].your_quote}</blockquote>

                  <div className='text-end blockQuote'>
                    <small>Created by: {post[1].created_by}</small>
                  </div>
                </Card.Body>
                <Card.Footer>
                  <Row>
                    <Col className='col-8'>
                      <small className="text-muted">Total donations: Ⓝ{convertToNear(post[1].donation)}</small>
                    </Col>
                    <Col className='col-4 text-end'>
                      <Button
                        className='btn-sm'
                        onClick={() => donateShow(post[0])}>
                          Donate
                      </Button>
                    </Col>
                  </Row>
                </Card.Footer>
              </Card>
            </Col>
          )
        })}
        </Row>

        <div className='fixed-bottom'>
          <div className='content-wrapper'>
            <Button
              className='create-btn'
              variant='danger'
              onClick={createPostShow}>+</Button>
          </div>
        </div>
      </div>

      <MyModal
        heading='Create new'
        body={() => (
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Image link</Form.Label>
              <Form.Control
                type="text"
                placeholder="https://picsum.photos/500/500?id=1"
                value={imageLink}
                onChange={(e) => setImageLink(e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Company name</Form.Label>
              <Form.Control
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                type="text"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Your quote</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={yourQuote}
                onChange={(e) => setYourQuote(e.target.value)} />
            </Form.Group>
          </Form>
        )}
        footer={() => (
          <>
            <Button variant="secondary" onClick={createPostClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={createPost}>
              Submit
            </Button>
          </>
        )}
        show={showCreatePost} />

      <MyModal
        heading='Donate'
        body={() => (
          <InputGroup className="mb-3">
            <InputGroup.Text>Ⓝ</InputGroup.Text>
            <FormControl
              type='number'
              step={0.1}
              value={donateAmount}
              onChange={e => setDonateAmount(e.target.value)}
            />
          </InputGroup>
        )}
        footer={() => (
          <>
            <Button variant="secondary" onClick={donateClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={donate}>
              Submit
            </Button>
          </>
        )}
        show={showDonate} />
    </main>
  )
}
